import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { isGitHubNotFoundError } from "#/lib/server/content-errors.server";

export interface RepositoryFile {
	path: string;
	sha: string;
	content: string;
}

export interface RepositoryEntry {
	name: string;
	path: string;
	sha: string;
}

/**
 * GitHub applies secondary rate limits to bursts of concurrent requests, and a
 * repository with hundreds of documents would otherwise open hundreds of
 * sockets at once. Keep the fan-out bounded.
 */
const MAX_CONCURRENT_READS = 8;

/**
 * Repository listings are re-read on nearly every navigation. A short TTL keeps
 * the UI responsive without holding stale data long enough to be noticed, and
 * keeps a handful of page loads from exhausting the hourly API quota.
 */
const LISTING_CACHE_TTL_MS = 10_000;

const listingCache = new Map<
	string,
	{ expiresAt: number; entries: RepositoryEntry[] }
>();

export function base64ToUtf8(base64: string) {
	return Buffer.from(base64, "base64").toString("utf8");
}

export function utf8ToBase64(text: string) {
	return Buffer.from(text, "utf8").toString("base64");
}

export function base64ToBytes(base64: string) {
	return new Uint8Array(Buffer.from(base64, "base64"));
}

export function bytesToBase64(bytes: Uint8Array) {
	return Buffer.from(bytes).toString("base64");
}

/** Runs tasks with a bounded number in flight, preserving input order. */
export async function mapWithConcurrency<TInput, TOutput>(
	items: readonly TInput[],
	limit: number,
	task: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
	const results = new Array<TOutput>(items.length);
	let cursor = 0;

	const workers = Array.from(
		{ length: Math.min(limit, items.length) },
		async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await task(items[index] as TInput);
			}
		},
	);

	await Promise.all(workers);
	return results;
}

function invalidateRepositoryListings() {
	listingCache.clear();
}

/**
 * Lists the markdown documents directly inside `directory`.
 *
 * A missing directory is not an error: a fresh content repository simply has
 * nothing in it yet, and the caller should render an empty collection.
 */
export async function listMarkdownEntries(
	directory: string,
): Promise<RepositoryEntry[]> {
	const cached = listingCache.get(directory);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.entries;
	}

	const env = getGitHubEnv();
	const octokit = getGitHubClient();

	let entries: RepositoryEntry[];
	try {
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: directory,
		});

		entries = Array.isArray(response.data)
			? response.data
					.filter(
						(entry) =>
							entry.type === "file" && /\.mdx?$/.test(entry.name ?? ""),
					)
					.map((entry) => ({
						name: entry.name,
						path: entry.path,
						sha: entry.sha,
					}))
			: [];
	} catch (error) {
		if (!isGitHubNotFoundError(error)) {
			throw error;
		}
		entries = [];
	}

	listingCache.set(directory, {
		entries,
		expiresAt: Date.now() + LISTING_CACHE_TTL_MS,
	});

	return entries;
}

export async function readRepositoryFile(
	path: string,
): Promise<RepositoryFile | null> {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();

	try {
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			return null;
		}

		return {
			path,
			sha: response.data.sha,
			content: base64ToUtf8(response.data.content),
		};
	} catch (error) {
		if (isGitHubNotFoundError(error)) {
			return null;
		}
		throw error;
	}
}

export async function readRepositoryFiles(
	paths: readonly string[],
): Promise<(RepositoryFile | null)[]> {
	return mapWithConcurrency(paths, MAX_CONCURRENT_READS, readRepositoryFile);
}

export async function writeRepositoryFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
): Promise<string> {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const response = await octokit.repos.createOrUpdateFileContents({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
		message,
		content: utf8ToBase64(content),
		sha,
	});

	const nextSha = response.data.content?.sha;
	if (!nextSha) {
		throw new Error("GitHub did not return the updated file revision");
	}

	invalidateRepositoryListings();
	return nextSha;
}

export async function deleteRepositoryFile(
	path: string,
	message: string,
	sha: string,
): Promise<void> {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	await octokit.repos.deleteFile({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
		message,
		sha,
	});

	invalidateRepositoryListings();
}
