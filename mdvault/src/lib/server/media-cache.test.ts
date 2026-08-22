import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMediaStore, type MediaFetchOutcome } from "./media-cache.server";

const dirs: string[] = [];

async function tempDir() {
	const dir = await mkdtemp(join(tmpdir(), "mdvault-test-"));
	dirs.push(dir);
	return dir;
}

afterEach(async () => {
	await Promise.all(
		dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

function blob(text: string): MediaFetchOutcome {
	return {
		status: "ok",
		blob: {
			bytes: new TextEncoder().encode(text),
			contentType: "image/png",
			etag: `"${text}"`,
		},
	};
}

const noSleep = () => Promise.resolve();

describe("single flight", () => {
	/**
	 * The regression this whole module exists for: a page requesting the same
	 * image many times at once must not produce many GitHub reads.
	 */
	it("collapses concurrent requests for the same file into one read", async () => {
		const readBlob = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			return blob("a");
		});
		const store = createMediaStore({ readBlob, cacheDir: await tempDir() });

		const results = await Promise.all(
			Array.from({ length: 25 }, () => store.get("media/a.png")),
		);

		expect(readBlob).toHaveBeenCalledTimes(1);
		expect(results.every((r) => r.status === "ok")).toBe(true);
	});

	it("still reads distinct files separately", async () => {
		const readBlob = vi.fn(async (path: string) => blob(path));
		const store = createMediaStore({ readBlob, cacheDir: await tempDir() });

		await Promise.all([
			store.get("media/a.png"),
			store.get("media/b.png"),
			store.get("media/c.png"),
		]);

		expect(readBlob).toHaveBeenCalledTimes(3);
	});
});

describe("bounded concurrency", () => {
	it("never exceeds the configured number of reads in flight", async () => {
		let active = 0;
		let peak = 0;

		const readBlob = vi.fn(async (path: string) => {
			active += 1;
			peak = Math.max(peak, active);
			await new Promise((resolve) => setTimeout(resolve, 2));
			active -= 1;
			return blob(path);
		});

		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			concurrency: 4,
		});

		await Promise.all(
			Array.from({ length: 40 }, (_, i) => store.get(`media/${i}.png`)),
		);

		expect(peak).toBeLessThanOrEqual(4);
		expect(readBlob).toHaveBeenCalledTimes(40);
	});
});

describe("caching", () => {
	it("serves a versioned entry from cache without reading again", async () => {
		const readBlob = vi.fn(async () => blob("a"));
		const store = createMediaStore({ readBlob, cacheDir: await tempDir() });

		await store.get("media/a.png", "sha1");
		await store.get("media/a.png", "sha1");
		await store.get("media/a.png", "sha1");

		expect(readBlob).toHaveBeenCalledTimes(1);
	});

	it("treats a different version as a different entry", async () => {
		const readBlob = vi.fn(async () => blob("a"));
		const store = createMediaStore({ readBlob, cacheDir: await tempDir() });

		await store.get("media/a.png", "sha1");
		await store.get("media/a.png", "sha2");

		expect(readBlob).toHaveBeenCalledTimes(2);
	});

	it("revalidates an unversioned entry once its ttl expires", async () => {
		const readBlob = vi.fn(async () => blob("a"));
		let clock = 1_000;
		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			ttlMs: 500,
			now: () => clock,
		});

		await store.get("media/a.png");
		clock += 100;
		await store.get("media/a.png");
		expect(readBlob).toHaveBeenCalledTimes(1);

		clock += 1_000;
		await store.get("media/a.png");
		expect(readBlob).toHaveBeenCalledTimes(2);
	});

	it("survives a restart by reading the disk cache", async () => {
		const cacheDir = await tempDir();
		const readBlob = vi.fn(async () => blob("a"));

		const first = createMediaStore({ readBlob, cacheDir });
		await first.get("media/a.png", "sha1");

		const afterRestart = createMediaStore({ readBlob, cacheDir });
		const outcome = await afterRestart.get("media/a.png", "sha1");

		expect(readBlob).toHaveBeenCalledTimes(1);
		expect(outcome.status).toBe("ok");
	});
});

describe("failures", () => {
	it("retries a rate limit and succeeds", async () => {
		const readBlob = vi
			.fn<(path: string) => Promise<MediaFetchOutcome>>()
			.mockResolvedValueOnce({ status: "rate-limited", retryAfterSeconds: 1 })
			.mockResolvedValueOnce(blob("a"));

		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			sleep: noSleep,
		});

		expect((await store.get("media/a.png")).status).toBe("ok");
		expect(readBlob).toHaveBeenCalledTimes(2);
	});

	it("gives up after the retry budget and reports the rate limit", async () => {
		const readBlob = vi.fn(
			async (): Promise<MediaFetchOutcome> => ({
				status: "rate-limited",
				retryAfterSeconds: 2,
			}),
		);

		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			maxRetries: 2,
			sleep: noSleep,
		});

		const outcome = await store.get("media/a.png");

		expect(outcome).toMatchObject({ status: "rate-limited" });
		expect(readBlob).toHaveBeenCalledTimes(3);
	});

	/**
	 * A rate limit must degrade to a slightly old image, never to a broken one.
	 */
	it("serves the stale copy when a refresh is rate limited", async () => {
		let clock = 1_000;
		const readBlob = vi
			.fn<(path: string) => Promise<MediaFetchOutcome>>()
			.mockResolvedValueOnce(blob("cached"))
			.mockResolvedValue({ status: "rate-limited", retryAfterSeconds: 1 });

		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			ttlMs: 100,
			maxRetries: 0,
			sleep: noSleep,
			now: () => clock,
		});

		await store.get("media/a.png");
		clock += 5_000;
		const outcome = await store.get("media/a.png");

		expect(outcome.status).toBe("ok");
		if (outcome.status === "ok") {
			expect(new TextDecoder().decode(outcome.blob.bytes)).toBe("cached");
		}
	});

	it("never turns a failure into not-found", async () => {
		const store = createMediaStore({
			readBlob: async () => ({ status: "error", message: "boom" }),
			cacheDir: await tempDir(),
			maxRetries: 0,
			sleep: noSleep,
		});

		expect((await store.get("media/a.png")).status).toBe("error");
	});

	it("reports a real not-found immediately, without retrying", async () => {
		const readBlob = vi.fn(
			async (): Promise<MediaFetchOutcome> => ({ status: "not-found" }),
		);
		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			sleep: noSleep,
		});

		expect((await store.get("media/missing.png")).status).toBe("not-found");
		expect(readBlob).toHaveBeenCalledTimes(1);
	});

	it("does not cache a failure", async () => {
		const readBlob = vi
			.fn<(path: string) => Promise<MediaFetchOutcome>>()
			.mockResolvedValueOnce({ status: "error", message: "boom" })
			.mockResolvedValue(blob("a"));

		const store = createMediaStore({
			readBlob,
			cacheDir: await tempDir(),
			maxRetries: 0,
			sleep: noSleep,
		});

		expect((await store.get("media/a.png")).status).toBe("error");
		expect((await store.get("media/a.png")).status).toBe("ok");
	});
});
