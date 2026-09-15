import { VAULT_ROOT } from "#/features/vault/vault.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { parseFrontmatter } from "#/lib/frontmatter";
import {
	invalidateRepositoryListings,
	mapWithConcurrency,
} from "#/lib/server/github-files.server";
import type {
	MediaAudit,
	MediaFile,
	MediaTarget,
	MediaUsageReference,
} from "./media.types";
import { MediaTargetsSchema, MoveMediaSchema } from "./media-management.schema";
import {
	MEDIA_EXTENSION,
	resolveMediaFolder,
	resolveMediaPath,
} from "./media-path";
import {
	collectMediaReferences,
	type MediaReferenceContext,
	replaceMediaReferences,
	verifyMediaReferences,
} from "./media-references";

type TreeEntry = {
	path: string;
	sha: string;
	type: string;
	mode: string;
	size?: number;
};
type TreeChange =
	| {
			path: string;
			mode: "100644" | "100755";
			type: "blob";
			sha: string | null;
	  }
	| { path: string; mode: "100644" | "100755"; type: "blob"; content: string };

async function readSnapshot() {
	const env = getGitHubEnv();
	const client = getGitHubClient();
	const repo = { owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO };
	const repository = await client.repos.get(repo);
	const branch = repository.data.default_branch;
	const ref = await client.git.getRef({ ...repo, ref: `heads/${branch}` });
	const commit = ref.data.object.sha;
	const revision = await client.git.getCommit({ ...repo, commit_sha: commit });
	const tree = await client.git.getTree({
		...repo,
		tree_sha: revision.data.tree.sha,
		recursive: "true",
	});
	if (tree.data.truncated)
		throw new Error(
			"The repository scan is incomplete. Media changes are blocked.",
		);
	const entries: TreeEntry[] = tree.data.tree.map((entry) => {
		if (!entry.path || !entry.sha || !entry.type || !entry.mode)
			throw new Error("The repository returned an incomplete tree entry.");
		return {
			path: entry.path,
			sha: entry.sha,
			type: entry.type,
			mode: entry.mode,
			size: entry.size,
		};
	});
	return {
		env,
		client,
		repo,
		branch,
		commit,
		treeSha: revision.data.tree.sha,
		entries,
	};
}

function contentKind(
	path: string,
	articlesRoot: string,
	postsRoot: string,
): MediaUsageReference["type"] | null {
	if (!/\.mdx?$/i.test(path)) return null;
	if (path.startsWith(`${articlesRoot}/`)) return "article";
	if (path.startsWith(`${postsRoot}/`)) return "post";
	if (path.startsWith(`${VAULT_ROOT}/`)) return "vault";
	return null;
}

async function scanSnapshot(
	snapshot: Awaited<ReturnType<typeof readSnapshot>>,
) {
	const { env, client, repo, entries, branch } = snapshot;
	const context: MediaReferenceContext = {
		mediaRoot: env.MEDIA_PATH,
		owner: repo.owner,
		repo: repo.repo,
		branch,
	};
	const media: MediaFile[] = entries
		.filter(
			(entry) =>
				entry.type === "blob" &&
				entry.mode !== "120000" &&
				entry.path.startsWith(`${env.MEDIA_PATH}/`) &&
				MEDIA_EXTENSION.test(entry.path),
		)
		.map((entry) => ({
			id: entry.path,
			name: entry.path.split("/").at(-1) ?? entry.path,
			path: entry.path,
			url: entry.path,
			sha: entry.sha,
			size: entry.size ?? 0,
			uploadedAt: "",
		}));
	const candidates = entries.filter((entry) =>
		contentKind(entry.path, env.ARTICLES_PATH, env.POSTS_PATH),
	);
	if (
		candidates.length > 2500 ||
		candidates.reduce((sum, file) => sum + (file.size ?? 0), 0) >
			20 * 1024 * 1024
	) {
		throw new Error(
			"This repository exceeds the media scan limit (2,500 documents or 20 MB). No changes were made.",
		);
	}
	const documents = await mapWithConcurrency(candidates, 6, async (entry) => {
		if (
			!["100644", "100755"].includes(entry.mode) ||
			(entry.size ?? 0) > 2 * 1024 * 1024
		)
			throw new Error(
				`Cannot safely scan ${entry.path}. Media changes are blocked.`,
			);
		const blob = await client.git.getBlob({ ...repo, file_sha: entry.sha });
		if (
			blob.data.encoding !== "base64" ||
			(blob.data.size ?? 0) > 2 * 1024 * 1024
		)
			throw new Error(`Cannot read ${entry.path}. Media changes are blocked.`);
		const raw = new TextDecoder("utf-8", { fatal: true }).decode(
			Buffer.from(blob.data.content, "base64"),
		);
		const { data } = parseFrontmatter(raw);
		const references = collectMediaReferences(raw, entry.path, context);
		verifyMediaReferences(raw, data, references, entry.path, context);
		const type = contentKind(entry.path, env.ARTICLES_PATH, env.POSTS_PATH);
		if (!type) throw new Error("Unsupported content path");
		const reference: MediaUsageReference = {
			id: (entry.path.split("/").at(-1) ?? entry.path).replace(/\.mdx?$/i, ""),
			title: typeof data.title === "string" ? data.title : entry.path,
			type,
			path: entry.path,
			...(type === "vault" ? { assetType: entry.path.split("/")[1] } : {}),
		};
		return {
			...entry,
			raw,
			reference,
			references,
		};
	});
	const usages = new Map<string, MediaUsageReference[]>();
	for (const document of documents) {
		for (const path of new Set(
			document.references.map((reference) => reference.path),
		)) {
			usages.set(path, [...(usages.get(path) ?? []), document.reference]);
		}
	}
	const existing = new Set(media.map((file) => file.path));
	const audit: MediaAudit = {
		mediaRoot: env.MEDIA_PATH,
		commit: snapshot.commit,
		scannedAt: new Date().toISOString(),
		documentCount: documents.length,
		usage: Object.fromEntries(
			media.map((file) => [
				file.path,
				{
					isUsed: usages.has(file.path),
					usedInEntries: usages.get(file.path) ?? [],
				},
			]),
		),
		unusedPaths: media
			.filter((file) => !usages.has(file.path))
			.map((file) => file.path),
		missing: [...usages]
			.filter(([path]) => !existing.has(path))
			.map(([path, usedInEntries]) => ({ path, usedInEntries })),
	};
	return { media, documents, audit };
}

export async function auditMedia() {
	return (await scanSnapshot(await readSnapshot())).audit;
}

function validateTargets(
	targets: MediaTarget[],
	snapshot: Awaited<ReturnType<typeof readSnapshot>>,
	media: MediaFile[],
) {
	for (const target of targets) {
		if (resolveMediaPath(target.path, snapshot.env.MEDIA_PATH) !== target.path)
			throw new Error("Invalid media path");
		const current = media.find((file) => file.path === target.path);
		if (!current || current.sha !== target.sha)
			throw new Error(
				`${target.path} changed in GitHub. Refresh the media library and try again.`,
			);
	}
}

async function commitChanges(
	snapshot: Awaited<ReturnType<typeof readSnapshot>>,
	changes: TreeChange[],
	message: string,
) {
	const { client, repo, branch } = snapshot;
	const current = await client.git.getRef({ ...repo, ref: `heads/${branch}` });
	if (current.data.object.sha !== snapshot.commit)
		throw new Error(
			"The repository changed during the scan. Refresh and try again.",
		);
	const tree = await client.git.createTree({
		...repo,
		base_tree: snapshot.treeSha,
		tree: changes,
	});
	const commit = await client.git.createCommit({
		...repo,
		tree: tree.data.sha,
		parents: [snapshot.commit],
		message,
	});
	// A concurrent write makes this non-fast-forward: never force or overwrite it.
	await client.git.updateRef({
		...repo,
		ref: `heads/${branch}`,
		sha: commit.data.sha,
		force: false,
	});
	invalidateRepositoryListings();
	return commit.data.sha;
}

export async function moveMedia(input: {
	targets: MediaTarget[];
	folder: string;
}) {
	const { targets, folder } = MoveMediaSchema.parse(input);
	const snapshot = await readSnapshot();
	const destination = resolveMediaFolder(folder, snapshot.env.MEDIA_PATH);
	const scan = await scanSnapshot(snapshot);
	validateTargets(targets, snapshot, scan.media);
	const moves = new Map<string, string>();
	const existing = new Set(snapshot.entries.map((entry) => entry.path));
	const changes: TreeChange[] = [];
	for (const target of targets) {
		const path = `${destination}/${target.path.split("/").at(-1)}`;
		if (path === target.path) continue;
		if (existing.has(path) || [...moves.values()].includes(path))
			throw new Error(`An item already exists at ${path}. Nothing was moved.`);
		const segments = destination.split("/");
		if (
			segments.some((_, index) =>
				snapshot.entries.some(
					(entry) =>
						entry.path === segments.slice(0, index + 1).join("/") &&
						entry.type !== "tree",
				),
			)
		)
			throw new Error("The destination conflicts with an existing file.");
		moves.set(target.path, path);
		const mode = snapshot.entries.find(
			(entry) => entry.path === target.path,
		)?.mode;
		if (mode !== "100644" && mode !== "100755")
			throw new Error("Unsupported media file mode");
		changes.push(
			{ path: target.path, mode, type: "blob", sha: null },
			{ path, mode, type: "blob", sha: target.sha },
		);
	}
	if (!moves.size) throw new Error("These assets are already in that folder.");
	let updatedDocuments = 0;
	for (const document of scan.documents) {
		const content = replaceMediaReferences(
			document.raw,
			document.references,
			moves,
		);
		if (content === document.raw) continue;
		updatedDocuments++;
		changes.push({
			path: document.path,
			mode: document.mode as "100644" | "100755",
			type: "blob",
			content,
		});
	}
	const commit = await commitChanges(
		snapshot,
		changes,
		`Move ${moves.size} media assets to ${destination}`,
	);
	return { commit, moved: moves.size, updatedDocuments };
}

export async function deleteMedia(targets: MediaTarget[]) {
	MediaTargetsSchema.parse(targets);
	const snapshot = await readSnapshot();
	const scan = await scanSnapshot(snapshot);
	validateTargets(targets, snapshot, scan.media);
	const used = targets.filter(
		(target) => scan.audit.usage[target.path]?.isUsed,
	);
	if (used.length)
		throw new Error(
			"Some selected assets are in use. Remove their content references before deleting them.",
		);
	const changes: TreeChange[] = targets.map((target) => ({
		path: target.path,
		mode: "100644",
		type: "blob",
		sha: null,
	}));
	const commit = await commitChanges(
		snapshot,
		changes,
		`Delete ${targets.length} unused media assets`,
	);
	return { commit, deleted: targets.length };
}
