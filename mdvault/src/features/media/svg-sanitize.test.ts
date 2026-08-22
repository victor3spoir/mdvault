import { describe, expect, it } from "vitest";
import { isSvgDocument, sanitizeSvg } from "./svg-sanitize";

const wrap = (inner: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`;

describe("isSvgDocument", () => {
	it("accepts a real svg", () => {
		expect(isSvgDocument(wrap("<circle r='4'/>"))).toBe(true);
	});

	it("rejects anything else", () => {
		expect(isSvgDocument("<html><body>hi</body></html>")).toBe(false);
		expect(isSvgDocument("not markup at all")).toBe(false);
		// A tag that merely starts with "svg" must not pass.
		expect(isSvgDocument("<svgfoo />")).toBe(false);
	});
});

describe("sanitizeSvg", () => {
	it("keeps harmless drawing markup untouched", () => {
		const safe = wrap(
			'<path d="M4 4h16v16H4z" fill="#2a9d8f" stroke-width="2"/><circle cx="12" cy="12" r="5"/>',
		);
		const { svg, removed } = sanitizeSvg(safe);

		expect(svg).toBe(safe);
		expect(removed).toEqual([]);
	});

	it("strips script elements", () => {
		const { svg, removed } = sanitizeSvg(
			wrap(
				"<script>alert(document.cookie)</script><rect width='10' height='10'/>",
			),
		);

		expect(svg).not.toMatch(/script/i);
		expect(svg).toContain("<rect");
		expect(removed).toContain("<script>");
	});

	it("strips event handlers", () => {
		const { svg, removed } = sanitizeSvg(
			wrap(
				'<rect width="10" height="10" onload="alert(1)" onclick="steal()"/>',
			),
		);

		expect(svg).not.toMatch(/onload|onclick/i);
		expect(svg).toContain("<rect");
		expect(removed).toEqual(expect.arrayContaining(["onload", "onclick"]));
	});

	it("strips javascript: links", () => {
		const { svg } = sanitizeSvg(
			wrap('<a href="javascript:alert(1)"><text>click</text></a>'),
		);

		expect(svg).not.toMatch(/javascript\s*:/i);
	});

	it("strips remote references that would phone home", () => {
		const { svg, removed } = sanitizeSvg(
			wrap('<image href="https://evil.test/pixel.png" width="1" height="1"/>'),
		);

		expect(svg).not.toContain("evil.test");
		expect(removed.join(" ")).toContain("href");
	});

	it("keeps in-document references, which fills and gradients need", () => {
		const safe = wrap(
			'<defs><linearGradient id="g"/></defs><rect fill="url(#g)" width="10" height="10"/><use href="#g"/>',
		);
		const { svg, removed } = sanitizeSvg(safe);

		expect(svg).toContain('href="#g"');
		expect(svg).toContain("url(#g)");
		expect(removed).toEqual([]);
	});

	it("keeps inline raster data urls", () => {
		const safe = wrap(
			'<image href="data:image/png;base64,iVBORw0KGgo=" width="4" height="4"/>',
		);

		expect(sanitizeSvg(safe).svg).toContain("data:image/png;base64");
	});

	it("strips data:text/html, which is not an image", () => {
		const { svg } = sanitizeSvg(
			wrap('<image href="data:text/html;base64,PHNjcmlwdD4="/>'),
		);

		expect(svg).not.toContain("text/html");
	});

	it("strips foreignObject, which can carry html and scripts", () => {
		const { svg, removed } = sanitizeSvg(
			wrap(
				"<foreignObject><body><script>alert(1)</script></body></foreignObject>",
			),
		);

		expect(svg).not.toMatch(/foreignObject/i);
		expect(removed).toContain("<foreignObject>");
	});

	it("strips doctype and entity declarations", () => {
		const { svg, removed } = sanitizeSvg(
			`<!DOCTYPE svg [<!ENTITY a "aaaaaaaaaa">]>${wrap("<rect/>")}`,
		);

		expect(svg).not.toMatch(/DOCTYPE|ENTITY/i);
		expect(removed).toContain("doctype");
	});

	it("is case-insensitive and survives odd spacing", () => {
		const { svg } = sanitizeSvg(
			wrap('<RECT ONLOAD = "alert(1)" /><SCRIPT>x()</SCRIPT>'),
		);

		expect(svg).not.toMatch(/onload/i);
		expect(svg).not.toMatch(/script/i);
	});
});
