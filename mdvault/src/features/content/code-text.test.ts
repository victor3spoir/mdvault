import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { codeTextOf } from "./components/markdown-content";

describe("codeTextOf", () => {
	it("reads plain children", () => {
		expect(codeTextOf(createElement("code", null, "graph TD;"))).toBe(
			"graph TD;",
		);
	});

	/**
	 * The regression: with a highlighter configured, the markdown renderer puts
	 * the code in dangerouslySetInnerHTML and leaves children undefined, so a
	 * mermaid block rendered forever with an empty source.
	 */
	it("reads highlighted code out of dangerouslySetInnerHTML", () => {
		const highlighted = createElement("code", {
			// biome-ignore lint/security/noDangerouslySetInnerHtml: reproducing what the markdown renderer emits
			dangerouslySetInnerHTML: {
				__html:
					'<span class="keyword">graph</span> <span class="type">TD</span>;',
			},
		});

		expect(codeTextOf(createElement("pre", null, highlighted))).toBe(
			"graph TD;",
		);
	});

	it("decodes entities so operators survive", () => {
		const highlighted = createElement("code", {
			// biome-ignore lint/security/noDangerouslySetInnerHtml: reproducing what the markdown renderer emits
			dangerouslySetInnerHTML: {
				__html: "A --&gt; B &amp;&amp; C &lt; D &#39;x&#39;",
			},
		});

		expect(codeTextOf(highlighted)).toBe("A --> B && C < D 'x'");
	});

	it("returns an empty string for nothing renderable", () => {
		expect(codeTextOf(null)).toBe("");
	});
});
