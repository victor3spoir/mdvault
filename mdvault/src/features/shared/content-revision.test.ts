import { describe, expect, it } from "vitest";
import {
	assertContentRevision,
	ContentConflictError,
	ContentRevisionSchema,
	getContentPathCandidates,
	resolveContentPath,
} from "./content-revision";

const sha = "a".repeat(40);

describe("content revisions", () => {
	it("accepts GitHub file revisions", () => {
		expect(
			ContentRevisionSchema.parse({ path: "articles/example.mdx", sha }),
		).toEqual({ path: "articles/example.mdx", sha });
	});

	it("resolves markdown files under the configured root", () => {
		expect(getContentPathCandidates("content/articles", "example")).toEqual([
			"content/articles/example.md",
			"content/articles/example.mdx",
		]);
		expect(
			resolveContentPath(
				"content/articles",
				"example",
				"content/articles/example.mdx",
			),
		).toBe("content/articles/example.mdx");
		expect(
			resolveContentPath("content/articles", "example", "posts/example.md"),
		).toBeNull();
	});

	it("rejects stale revisions", () => {
		expect(() => assertContentRevision(sha, "b".repeat(40), "Article")).toThrow(
			ContentConflictError,
		);
		expect(() => assertContentRevision(sha, sha, "Article")).not.toThrow();
	});
});
