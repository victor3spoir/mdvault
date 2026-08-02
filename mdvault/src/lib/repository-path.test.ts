import { describe, expect, it } from "vitest";
import {
	getRepositoryFilePath,
	getRepositoryMediaFilePath,
	normalizeRepositoryPath,
} from "./repository-path";

describe("repository path confinement", () => {
	it("keeps files under the configured root", () => {
		expect(
			getRepositoryFilePath("content/articles", "hello-world", ".md"),
		).toBe("content/articles/hello-world.md");
		expect(getRepositoryMediaFilePath("content/media", "cover.png")).toBe(
			"content/media/cover.png",
		);
	});

	it("rejects traversal and encoded traversal", () => {
		expect(getRepositoryFilePath("content/articles", "../secrets", ".md")).toBe(
			null,
		);
		expect(
			normalizeRepositoryPath(
				"content/articles/%2e%2e/secrets.md",
				"content/articles",
			),
		).toBeNull();
		expect(
			getRepositoryMediaFilePath("content/media", "nested/cover.png"),
		).toBe(null);
	});
});
