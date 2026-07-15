import { describe, expect, it } from "vitest";
import { ContentConflictError } from "#/features/shared/content-revision";
import { createContentErrorMessage } from "./content-errors.server";

describe("content error messages", () => {
	it("preserves conflict messages", () => {
		expect(
			createContentErrorMessage(new ContentConflictError("Article"), "Article"),
		).toBe("Article changed in GitHub. Reload it before saving again.");
	});

	it("distinguishes GitHub access, rate-limit, and availability errors", () => {
		expect(createContentErrorMessage({ status: 403 }, "Article")).toBe(
			"GitHub denied access to the configured repository.",
		);
		expect(createContentErrorMessage({ status: 429 }, "Article")).toBe(
			"GitHub rate limit reached. Please try again later.",
		);
		expect(createContentErrorMessage({ status: 503 }, "Article")).toBe(
			"GitHub is temporarily unavailable. Please try again later.",
		);
	});
});
