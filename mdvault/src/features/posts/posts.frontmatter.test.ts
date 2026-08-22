import { describe, expect, it } from "vitest";
import { parseFrontmatterToPost } from "./posts.server";

describe("post frontmatter", () => {
	it("parses valid persisted metadata", () => {
		const parsed = parseFrontmatterToPost(`---
title: Example post
published: true
lang: fr
author: Victor
---
Post body`);

		expect(parsed).toMatchObject({
			title: "Example post",
			published: true,
			lang: "fr",
			author: "Victor",
			content: "Post body",
		});
	});

	it("applies defaults when optional metadata is absent", () => {
		const parsed = parseFrontmatterToPost("Post body");

		expect(parsed).toMatchObject({
			title: "Untitled",
			published: false,
			lang: "en",
			content: "Post body",
		});
	});

	it("accepts configured locale identifiers beyond the legacy pair", () => {
		const parsed = parseFrontmatterToPost(`---
title: German post
published: false
lang: de
---
Body`);

		expect(parsed.lang).toBe("de");
	});
});
