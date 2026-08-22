// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { normalizePastedText, sanitizePastedHtml } from "./paste-cleanup";

describe("sanitizePastedHtml", () => {
	it("removes executable and embedded elements", () => {
		const result = sanitizePastedHtml(
			'<p>Keep <strong>this</strong></p><script>alert(1)</script><style>p{color:red}</style><iframe src="https://example.com"></iframe>',
		);

		expect(result).toBe("<p>Keep <strong>this</strong></p>");
	});

	it("strips foreign attributes while retaining semantic attributes", () => {
		const result = sanitizePastedHtml(
			'<h2 id="title" class="large" style="color:red" data-source="docs">Title</h2><ol start="3" class="list"><li value="4">Four</li></ol><table><tbody><tr><th scope="col" colspan="2" aria-label="Name">Name</th></tr></tbody></table>',
		);

		expect(result).toContain("<h2>Title</h2>");
		expect(result).toContain('<ol start="3"><li value="4">Four</li></ol>');
		expect(result).toContain('<th scope="col" colspan="2">Name</th>');
		expect(result).not.toMatch(/\b(?:class|style|id|data-|aria-)=/);
	});

	it("removes unsafe link and image sources but keeps safe URLs", () => {
		const result = sanitizePastedHtml(
			'<a href="javascript:alert(1)" onclick="alert(2)">Bad</a><a href="/articles/good" target="_blank">Good</a><img src="data:text/html,bad" alt="Bad"><img src="https://example.com/good.png" alt="Good" srcset="bad">',
		);

		expect(result).toBe(
			'<a>Bad</a><a href="/articles/good">Good</a><img alt="Bad"><img src="https://example.com/good.png" alt="Good">',
		);
	});

	it("preserves common semantic editor markup", () => {
		const result = sanitizePastedHtml(
			"<blockquote><p><em>Note</em> and <code>code</code></p></blockquote><ul><li>One</li></ul><pre><code>const x = 1;</code></pre>",
		);

		expect(result).toBe(
			"<blockquote><p><em>Note</em> and <code>code</code></p></blockquote><ul><li>One</li></ul><pre><code>const x = 1;</code></pre>",
		);
	});

	it("normalizes non-breaking and zero-width text", () => {
		expect(sanitizePastedHtml("<p>Hello\u00a0world\u200b!</p>")).toBe(
			"<p>Hello world!</p>",
		);
	});
});

describe("normalizePastedText", () => {
	it("normalizes clipboard text without collapsing ordinary whitespace", () => {
		expect(normalizePastedText("A\u00a0 B\u200d\n C")).toBe("A  B\n C");
	});
});
