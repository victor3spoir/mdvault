import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface MediaBlob {
	bytes: Uint8Array;
	contentType: string;
	etag: string;
}

export type MediaFetchOutcome =
	| { status: "ok"; blob: MediaBlob }
	| { status: "not-found" }
	| { status: "rate-limited"; retryAfterSeconds: number }
	| { status: "error"; message: string };

export interface MediaStoreDeps {
	/** Reads one blob from the repository. */
	readBlob: (path: string) => Promise<MediaFetchOutcome>;
	cacheDir?: string;
	/** Max blob reads in flight against GitHub. */
	concurrency?: number;
	/** How long an unversioned entry is served without revalidating. */
	ttlMs?: number;
	maxRetries?: number;
	sleep?: (ms: number) => Promise<void>;
	now?: () => number;
}

interface CacheEntry {
	blob: MediaBlob;
	storedAt: number;
}

const DEFAULT_CONCURRENCY = 6;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_RETRIES = 3;

function defaultSleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function cacheKey(path: string, version?: string) {
	return createHash("sha1")
		.update(`${path}::${version ?? ""}`)
		.digest("hex");
}

/**
 * Serves repository media with the properties a proxy needs to survive a page
 * that requests forty images at once:
 *
 * - a disk cache, so a restart does not re-download everything;
 * - single-flight, so N concurrent requests for the same file cause one read;
 * - a bounded queue, so a burst waits instead of tripping GitHub's secondary
 *   rate limits;
 * - retry with backoff that honours `Retry-After`;
 * - stale-on-error, so a rate limit degrades to a slightly old image rather
 *   than a broken one;
 * - honest outcomes, so only a real GitHub 404 can become a 404.
 */
export function createMediaStore({
	readBlob,
	cacheDir = join(tmpdir(), "mdvault-media"),
	concurrency = DEFAULT_CONCURRENCY,
	ttlMs = DEFAULT_TTL_MS,
	maxRetries = DEFAULT_MAX_RETRIES,
	sleep = defaultSleep,
	now = Date.now,
}: MediaStoreDeps) {
	const memory = new Map<string, CacheEntry>();
	const inFlight = new Map<string, Promise<MediaFetchOutcome>>();

	let active = 0;
	const waiting: Array<() => void> = [];

	async function withSlot<T>(task: () => Promise<T>): Promise<T> {
		if (active >= concurrency) {
			await new Promise<void>((resolve) => waiting.push(resolve));
		}
		active += 1;
		try {
			return await task();
		} finally {
			active -= 1;
			waiting.shift()?.();
		}
	}

	async function readDisk(key: string): Promise<CacheEntry | null> {
		try {
			const raw = await readFile(join(cacheDir, `${key}.json`), "utf8");
			const parsed = JSON.parse(raw) as {
				contentType: string;
				etag: string;
				storedAt: number;
				base64: string;
			};

			return {
				storedAt: parsed.storedAt,
				blob: {
					bytes: new Uint8Array(Buffer.from(parsed.base64, "base64")),
					contentType: parsed.contentType,
					etag: parsed.etag,
				},
			};
		} catch {
			return null;
		}
	}

	async function writeDisk(key: string, entry: CacheEntry) {
		try {
			await mkdir(cacheDir, { recursive: true });
			await writeFile(
				join(cacheDir, `${key}.json`),
				JSON.stringify({
					contentType: entry.blob.contentType,
					etag: entry.blob.etag,
					storedAt: entry.storedAt,
					base64: Buffer.from(entry.blob.bytes).toString("base64"),
				}),
			);
		} catch {
			// A cache that cannot be written must never fail the request.
		}
	}

	async function load(path: string): Promise<MediaFetchOutcome> {
		let lastRateLimit: MediaFetchOutcome | null = null;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			const outcome = await withSlot(() => readBlob(path));

			if (outcome.status === "ok" || outcome.status === "not-found") {
				return outcome;
			}

			lastRateLimit = outcome;

			if (attempt === maxRetries) {
				break;
			}

			const backoff =
				outcome.status === "rate-limited"
					? Math.max(outcome.retryAfterSeconds * 1000, 2 ** attempt * 250)
					: 2 ** attempt * 250;

			await sleep(backoff);
		}

		return lastRateLimit ?? { status: "error", message: "Unavailable" };
	}

	return {
		/**
		 * `version` is the blob SHA when the caller knows it. A versioned entry is
		 * immutable, so it never needs revalidating.
		 */
		async get(path: string, version?: string): Promise<MediaFetchOutcome> {
			const key = cacheKey(path, version);

			const cached = memory.get(key) ?? (await readDisk(key));
			if (cached) {
				memory.set(key, cached);
				const fresh = version !== undefined || now() - cached.storedAt < ttlMs;
				if (fresh) {
					return { status: "ok", blob: cached.blob };
				}
			}

			const pending = inFlight.get(key);
			if (pending) {
				return pending;
			}

			const request = (async (): Promise<MediaFetchOutcome> => {
				const outcome = await load(path);

				if (outcome.status === "ok") {
					const entry: CacheEntry = { blob: outcome.blob, storedAt: now() };
					memory.set(key, entry);
					await writeDisk(key, entry);
					return outcome;
				}

				// Rather than fail, keep serving what we already have.
				if (cached && outcome.status !== "not-found") {
					return { status: "ok", blob: cached.blob };
				}

				return outcome;
			})().finally(() => {
				inFlight.delete(key);
			});

			inFlight.set(key, request);
			return request;
		},

		/** Exposed for tests and diagnostics. */
		stats() {
			return { memoryEntries: memory.size, inFlight: inFlight.size, active };
		},
	};
}
