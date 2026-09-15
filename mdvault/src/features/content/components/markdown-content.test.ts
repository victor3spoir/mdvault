import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "#/features/content/components/markdown-content";

function render(source: string) {
	return renderToStaticMarkup(createElement(MarkdownContent, { source }));
}

describe("advanced Markdown rendering", () => {
	it("renders code with a persistent language and copy header above the source", () => {
		const html = render("```bash\nmultipass launch 26.04 --name srv-demo\n```");
		expect(html).toContain('class="code-block-frame"');
		expect(html).toContain('class="code-block-language">bash</span>');
		expect(html).toContain('aria-label="Copy code"');
		expect(html.indexOf('class="code-block-header"')).toBeLessThan(
			html.indexOf("<pre"),
		);
		expect(html).toContain('class="th-token th-command"');
		expect(html).not.toContain("group-hover");
	});

	it.each([
		"",
		"text",
		"plaintext",
	])("labels an unhighlighted %s fence as plain text", (language) => {
		const html = render(`\`\`\`${language}\nunchanged source\n\`\`\``);
		expect(html).toContain('class="code-block-language">Plain text</span>');
		expect(html).toContain("unchanged source");
	});

	it("preserves an unknown language label and escapes its code", () => {
		const html = render("```custom-lang\n<script>hello</script>\n```");
		expect(html).toContain('class="code-block-language">custom-lang</span>');
		expect(html).toContain("&lt;script&gt;hello&lt;/script&gt;");
	});

	it("keeps inline code out of the block frame", () => {
		const html = render("Use `multipass` here.");
		expect(html).not.toContain("code-block-frame");
		expect(html).toContain("<code>multipass</code>");
	});

	it("styles H4 headings in the shared live and page preview renderer", () => {
		const html = render("#### Une **sous-section**\n\nSon contenu.");
		expect(html).toMatch(
			/<h4[^>]*class="[^"]*text-xl[^"]*font-semibold[^"]*"[^>]*>/,
		);
		expect(html).toContain('id="une-sous-section"');
		expect(html).toContain("Une <strong>sous-section</strong></h4>");
		expect(html).toContain("Son contenu.");
	});

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
