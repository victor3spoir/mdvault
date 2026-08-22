import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "#/features/content/components/markdown-content";

function render(source: string) {
	return renderToStaticMarkup(createElement(MarkdownContent, { source }));
}

describe("advanced Markdown rendering", () => {
	it("renders GitHub-style alerts as callouts without the marker", () => {
		const html = render(
			"> [!WARNING]\n>\n> Back up the repository before continuing.",
		);

		expect(html).toContain('data-callout="warning"');
		expect(html).toContain("Back up the repository");
		expect(html).not.toContain("[!WARNING]");
	});

	it("renders compact GitHub-style alerts as callouts", () => {
		const html = render("> [!TIP]\n> Keep the URL portable.");

		expect(html).toContain('data-callout="tip"');
		expect(html).toContain("Keep the URL portable.");
		expect(html).not.toContain("[!TIP]");
	});

	it("does not normalize callout-like text inside fenced code", () => {
		const html = render("```md\n> [!TIP]\n> Keep this example compact.\n```");

		expect(html).not.toContain('data-callout="tip"');
		expect(html).toContain("[!TIP]");
	});

	it("renders standalone supported video URLs as privacy-conscious embeds", () => {
		const html = render("https://youtu.be/dQw4w9WgXcQ");

		expect(html).toContain(
			'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"',
		);
	});

	it("keeps unsupported standalone URLs as ordinary text", () => {
		const html = render("https://example.com/video");

		expect(html).not.toContain("<iframe");
		expect(html).toContain("https://example.com/video");
	});
});
