import { describe, expect, it } from "vitest";
import { parseArticleFrontmatter } from "./articles.frontmatter";

describe("article frontmatter", () => {
	it("parses valid persisted metadata", () => {
		const parsed = parseArticleFrontmatter(`---
title: Example article
published: false
lang: en
tags:
  - demo
---
Article body`);

		expect(parsed.frontmatter).toMatchObject({
			title: "Example article",
			published: false,
			lang: "en",
			tags: ["demo"],
		});
		expect(parsed.body.trim()).toBe("Article body");
	});

	it("applies defaults when optional metadata is absent", () => {
		const parsed = parseArticleFrontmatter("Article body");

		expect(parsed.frontmatter).toMatchObject({
			title: "Untitled",
			published: false,
			lang: "en",
		});
	});

	it("rejects invalid persisted metadata", () => {
		expect(() =>
			parseArticleFrontmatter(`---
title: Invalid article
published: invalid
lang: es
---
Body`),
		).toThrow("Invalid article content");
	});
});
