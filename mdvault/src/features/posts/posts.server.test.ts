import { beforeEach, describe, expect, it, vi } from "vitest";

const github = vi.hoisted(() => ({
	getContent: vi.fn(),
	createOrUpdateFileContents: vi.fn(),
}));

vi.mock("#/integrations/github/github-client.server", () => ({
	getGitHubClient: () => ({ repos: github }),
}));

vi.mock("#/integrations/github/github-env.server", () => ({
	getGitHubEnv: () => ({
		GITHUB_TOKEN: "token",
		GITHUB_OWNER: "owner",
		GITHUB_REPO: "repo",
		ARTICLES_PATH: "articles",
		POSTS_PATH: "posts",
		MEDIA_PATH: "media",
	}),
}));

import { updatePost } from "./posts.server";

const originalSha = "a".repeat(40);
const currentSha = "b".repeat(40);
const nextSha = "c".repeat(40);
const path = "posts/example.mdx";
const content = `---
title: Example
published: false
lang: en
---
Original body`;

function mockPost(sha: string) {
	github.getContent.mockResolvedValue({
		data: { type: "file", path, sha, content: btoa(content) },
	});
}

describe("post revision integrity", () => {
	beforeEach(() => {
		github.getContent.mockReset();
		github.createOrUpdateFileContents.mockReset();
	});

	it("rejects an update when GitHub has a newer revision", async () => {
		mockPost(currentSha);

		const result = await updatePost(
			"example",
			{ title: "Updated", author: undefined },
			{ path, sha: originalSha },
		);

		expect(result).toEqual({
			success: false,
			error: "Post changed in GitHub. Reload it before saving again.",
		});
		expect(github.createOrUpdateFileContents).not.toHaveBeenCalled();
	});

	it("writes the exact MDX path with the loaded revision", async () => {
		mockPost(originalSha);
		github.createOrUpdateFileContents.mockResolvedValue({
			data: { content: { sha: nextSha } },
		});

		const result = await updatePost(
			"example",
			{ title: "Updated", author: undefined },
			{ path, sha: originalSha },
		);

		expect(github.createOrUpdateFileContents).toHaveBeenCalledWith(
			expect.objectContaining({ path, sha: originalSha }),
		);
		expect(result).toEqual({
			success: true,
			data: { id: "example", path, sha: nextSha },
		});
	});
});
