import { describe, expect, it } from "vitest";
import { getPostExcerpt } from "./posts.utils";

describe("getPostExcerpt", () => {
	it("strips markdown syntax", () => {
		expect(
			getPostExcerpt(
				"## Title\n\n**bold** and [link](http://x.com) and `code`",
			),
		).toBe("Title bold and link and");
	});

	it("truncates long content at a word boundary with ellipsis", () => {
		const long = "word ".repeat(60);
		const excerpt = getPostExcerpt(long);
		expect(excerpt.length).toBeLessThanOrEqual(143);
		expect(excerpt.endsWith("...")).toBe(true);
	});

	it("returns short content untouched", () => {
		expect(getPostExcerpt("Short post.")).toBe("Short post.");
	});
});
