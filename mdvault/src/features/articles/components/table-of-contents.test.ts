import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { TableOfContents } from "./table-of-contents";

it("includes H4 with nested anchors and skips code and unsupported levels", () => {
	const html = renderToStaticMarkup(
		createElement(TableOfContents, {
			source:
				"## Section\n#### Une **sous-section**\n#### Une **sous-section**\n##### Legacy\n```md\n#### Code example\n```",
		}),
	);
	expect(html).toContain('href="#une-sous-section"');
	expect(html).toContain('href="#une-sous-section-2"');
	expect(html).toContain("margin-left:24px");
	expect(html).not.toContain("Legacy");
	expect(html).not.toContain("Code example");
});
