import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
	repos: { get: vi.fn() },
	git: {
		getRef: vi.fn(),
		getCommit: vi.fn(),
		getTree: vi.fn(),
		getBlob: vi.fn(),
		createTree: vi.fn(),
		createCommit: vi.fn(),
		updateRef: vi.fn(),
	},
}));
vi.mock("#/integrations/github/github-client.server", () => ({
	getGitHubClient: () => api,
}));
vi.mock("#/integrations/github/github-env.server", () => ({
	getGitHubEnv: () => ({
		GITHUB_OWNER: "owner",
		GITHUB_REPO: "repo",
		MEDIA_PATH: "media",
		ARTICLES_PATH: "articles",
		POSTS_PATH: "posts",
	}),
}));

import { auditMedia, deleteMedia, moveMedia } from "./media-management.server";

const sha = (value: string) => value.repeat(40);
const image = (path: string, revision = sha("a")) => ({
	path,
	sha: revision,
	type: "blob",
	mode: "100644",
	size: 20,
});
const docs = [
	{
		path: "articles/a.md",
		sha: sha("1"),
		raw: "---\ntitle: Article\ncoverImage: media/a.png\n---\n![Image](media/a.png#w=50&align=left)",
	},
	{
		path: "posts/p.md",
		sha: sha("2"),
		raw: "---\ntitle: Post\n---\n/media/a.png",
	},
	{
		path: "vault/projects/v.md",
		sha: sha("3"),
		raw: "---\ntitle: Project\n---\n![Cover](../../media/a.png)\n![Missing](media/missing.svg)",
	},
];
function setup(extra: ReturnType<typeof image>[] = []) {
	api.repos.get.mockResolvedValue({ data: { default_branch: "main" } });
	api.git.getRef.mockResolvedValue({ data: { object: { sha: sha("b") } } });
	api.git.getCommit.mockResolvedValue({ data: { tree: { sha: sha("c") } } });
	api.git.getTree.mockResolvedValue({
		data: {
			truncated: false,
			tree: [
				image("media/a.png"),
				image("media/unused.png", sha("d")),
				...docs.map((doc) => image(doc.path, doc.sha)),
				...extra,
			],
		},
	});
	api.git.getBlob.mockImplementation(
		async ({ file_sha }: { file_sha: string }) => {
			const raw = docs.find((doc) => doc.sha === file_sha)?.raw;
			if (raw === undefined) throw new Error("Unknown test blob");
			return {
				data: {
					content: Buffer.from(raw).toString("base64"),
					encoding: "base64",
					size: raw.length,
				},
			};
		},
	);
	api.git.createTree.mockResolvedValue({ data: { sha: sha("e") } });
	api.git.createCommit.mockResolvedValue({ data: { sha: sha("f") } });
	api.git.updateRef.mockResolvedValue({});
}
beforeEach(() => {
	vi.resetAllMocks();
	setup();
});
describe("media audit", () => {
	it("includes all managed content, deduplicates usages and finds missing images", async () => {
		const result = await auditMedia();
		expect(result.documentCount).toBe(3);
		expect(
			result.usage["media/a.png"].usedInEntries.map((entry) => entry.type),
		).toEqual(["article", "post", "vault"]);
		expect(result.unusedPaths).toEqual(["media/unused.png"]);
		expect(result.missing[0]).toMatchObject({
			path: "media/missing.svg",
			usedInEntries: [{ assetType: "projects", id: "v" }],
		});
	});
	it("fails closed on truncated trees", async () => {
		api.git.getTree.mockResolvedValue({ data: { truncated: true, tree: [] } });
		await expect(auditMedia()).rejects.toThrow("incomplete");
	});
	it("fails closed when any document cannot be read", async () => {
		api.git.getBlob.mockRejectedValue(new Error("Rate limited"));
		await expect(auditMedia()).rejects.toThrow();
	});
});
describe("atomic media mutations", () => {
	it("moves the blob and all references in one non-forced commit", async () => {
		await expect(
			moveMedia({
				targets: [{ path: "media/a.png", sha: sha("a") }],
				folder: "tutorials",
			}),
		).resolves.toMatchObject({ moved: 1, updatedDocuments: 3 });
		const changes = api.git.createTree.mock.calls[0][0].tree;
		expect(changes).toEqual(
			expect.arrayContaining([
				{ path: "media/a.png", mode: "100644", type: "blob", sha: null },
				{
					path: "media/tutorials/a.png",
					mode: "100644",
					type: "blob",
					sha: sha("a"),
				},
			]),
		);
		expect(
			changes.find(
				(change: { path: string }) => change.path === "articles/a.md",
			).content,
		).toContain("media/tutorials/a.png#w=50&align=left");
		expect(api.git.createCommit).toHaveBeenCalledOnce();
		expect(api.git.updateRef).toHaveBeenCalledWith(
			expect.objectContaining({
				force: false,
				ref: "heads/main",
				sha: sha("f"),
			}),
		);
	});
	it("rejects overwrites before creating any commit", async () => {
		setup([image("media/tutorials/a.png")]);
		await expect(
			moveMedia({
				targets: [{ path: "media/a.png", sha: sha("a") }],
				folder: "tutorials",
			}),
		).rejects.toThrow("already exists");
		expect(api.git.createTree).not.toHaveBeenCalled();
	});
	it("rejects stale selected revisions", async () => {
		await expect(
			deleteMedia([{ path: "media/unused.png", sha: sha("a") }]),
		).rejects.toThrow("changed");
		expect(api.git.createTree).not.toHaveBeenCalled();
	});
	it("blocks deleting used images on the server", async () => {
		await expect(
			deleteMedia([{ path: "media/a.png", sha: sha("a") }]),
		).rejects.toThrow("in use");
		expect(api.git.createTree).not.toHaveBeenCalled();
	});
	it("deletes an unused image in one commit", async () => {
		await expect(
			deleteMedia([{ path: "media/unused.png", sha: sha("d") }]),
		).resolves.toMatchObject({ deleted: 1 });
		expect(api.git.createTree.mock.calls[0][0].tree).toEqual([
			{ path: "media/unused.png", mode: "100644", type: "blob", sha: null },
		]);
	});
	it("rejects a repository changed during the scan", async () => {
		api.git.getRef
			.mockResolvedValueOnce({ data: { object: { sha: sha("b") } } })
			.mockResolvedValueOnce({ data: { object: { sha: sha("e") } } });
		await expect(
			deleteMedia([{ path: "media/unused.png", sha: sha("d") }]),
		).rejects.toThrow("changed during");
		expect(api.git.createTree).not.toHaveBeenCalled();
	});
	it("does not retry or force a concurrent branch update", async () => {
		api.git.updateRef.mockRejectedValue(new Error("Not a fast forward"));
		await expect(
			deleteMedia([{ path: "media/unused.png", sha: sha("d") }]),
		).rejects.toThrow();
		expect(api.git.updateRef).toHaveBeenCalledOnce();
	});
	it("cannot delete on incomplete usage checks", async () => {
		api.git.getBlob.mockRejectedValue(new Error("Unavailable"));
		await expect(
			deleteMedia([{ path: "media/unused.png", sha: sha("d") }]),
		).rejects.toThrow();
		expect(api.git.updateRef).not.toHaveBeenCalled();
	});
	it("rejects path traversal and no-op moves", async () => {
		await expect(
			moveMedia({
				targets: [{ path: "media/a.png", sha: sha("a") }],
				folder: "../other",
			}),
		).rejects.toThrow();
		await expect(
			moveMedia({
				targets: [{ path: "media/a.png", sha: sha("a") }],
				folder: "",
			}),
		).rejects.toThrow("already in");
		expect(api.git.updateRef).not.toHaveBeenCalled();
	});
});
