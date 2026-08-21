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
lang: english
---
Body`),
		).toThrow("Invalid article content");
	});

	it("accepts configured locale identifiers beyond the legacy pair", () => {
		const parsed = parseArticleFrontmatter(`---
title: Spanish article
published: false
lang: es
---
Body`);

		expect(parsed.frontmatter.lang).toBe("es");
	});

	it("keeps parsing articles written before translation keys existed", () => {
		const parsed = parseArticleFrontmatter(`---
title: Legacy article
published: true
lang: fr
---
Body`);

		expect(parsed.frontmatter.translationKey).toBeUndefined();
	});

	it("round-trips a translation key", () => {
		const parsed = parseArticleFrontmatter(`---
title: Linked article
published: true
lang: fr
translationKey: hello-world-a1b2c3
---
Body`);

		expect(parsed.frontmatter.translationKey).toBe("hello-world-a1b2c3");
	});

	it("rejects a malformed translation key", () => {
		expect(() =>
			parseArticleFrontmatter(`---
title: Broken article
published: true
lang: fr
translationKey: Hello World!
---
Body`),
		).toThrow("Invalid article content");
	});
});
