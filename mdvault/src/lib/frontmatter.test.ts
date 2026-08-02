import { describe, expect, it } from "vitest";
import {
	buildMarkdownDocument,
	FrontmatterError,
	MAX_FRONTMATTER_BYTES,
	parseFrontmatter,
	stringifyFrontmatter,
	stripFrontmatter,
} from "./frontmatter";

describe("frontmatter parsing", () => {
	it("splits metadata from the body", () => {
		const { data, body } = parseFrontmatter(`---
title: Example
published: true
tags:
  - demo
---
Body text`);

		expect(data).toEqual({
			title: "Example",
			published: true,
			tags: ["demo"],
		});
		expect(body).toBe("Body text");
	});

	it("treats a document without metadata as body only", () => {
		expect(parseFrontmatter("Just a body")).toEqual({
			data: {},
			body: "Just a body",
		});
	});

	it("treats an unterminated block as body only", () => {
		const raw = `---\ntitle: Example\nstill going`;

		expect(parseFrontmatter(raw).data).toEqual({});
	});

	it("handles CRLF line endings", () => {
		const { data, body } = parseFrontmatter(
			"---\r\ntitle: Windows\r\n---\r\nBody",
		);

		expect(data).toEqual({ title: "Windows" });
		expect(body).toBe("Body");
	});

	it("ignores a body that only looks like metadata", () => {
		const { data } = parseFrontmatter("Body with --- inside");

		expect(data).toEqual({});
	});
});

describe("frontmatter hardening", () => {
	it("rejects alias expansion bombs instead of exhausting memory", () => {
		const bomb = `---
a: &a ["x","x","x","x","x","x","x","x","x"]
b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]
d: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]
e: &e [*d,*d,*d,*d,*d,*d,*d,*d,*d]
f: &f [*e,*e,*e,*e,*e,*e,*e,*e,*e]
title: boom
---
body`;

		expect(() => parseFrontmatter(bomb)).toThrow(FrontmatterError);
	});

	it("rejects an oversized metadata block", () => {
		const huge = `---\ntitle: ${"a".repeat(MAX_FRONTMATTER_BYTES + 1)}\n---\nbody`;

		expect(() => parseFrontmatter(huge)).toThrow("too large");
	});

	it("rejects malformed yaml", () => {
		expect(() => parseFrontmatter("---\ntitle: [unclosed\n---\nbody")).toThrow(
			FrontmatterError,
		);
	});

	it("drops prototype polluting keys", () => {
		const { data } = parseFrontmatter(
			"---\n__proto__:\n  polluted: true\ntitle: Safe\n---\nbody",
		);

		expect(data).toEqual({ title: "Safe" });
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it("keeps a non-object metadata block from leaking through", () => {
		expect(parseFrontmatter("---\n- just\n- a list\n---\nbody").data).toEqual(
			{},
		);
	});
});

describe("frontmatter serialization", () => {
	it("omits empty values", () => {
		const yaml = stringifyFrontmatter({
			title: "Example",
			description: undefined,
			tags: [],
			author: null,
			published: false,
		});

		expect(yaml).toContain("title: Example");
		expect(yaml).not.toContain("description");
		expect(yaml).not.toContain("tags");
		expect(yaml).not.toContain("author");
		expect(yaml).toContain("published: false");
	});

	it("keeps multi-line values inside the metadata block", () => {
		const document = buildMarkdownDocument(
			{ title: "Line one\npublished: true" },
			"Body",
		);
		const { data, body } = parseFrontmatter(document);

		expect(data.title).toBe("Line one\npublished: true");
		expect(data.published).toBeUndefined();
		expect(body).toBe("Body");
	});

	it("round-trips a document without drift", () => {
		const first = buildMarkdownDocument(
			{ title: "Round trip", tags: ["a", "b"], published: true },
			"# Heading\n\nSome body",
		);
		const parsed = parseFrontmatter(first);
		const second = buildMarkdownDocument(parsed.data, parsed.body);

		expect(second).toBe(first);
	});

	it("does not wrap long values across lines", () => {
		const long = `A ${"very ".repeat(60)}long description`;
		const { data } = parseFrontmatter(
			buildMarkdownDocument({ description: long }, "body"),
		);

		expect(data.description).toBe(long);
	});

	it("strips metadata a caller tries to smuggle in through the body", () => {
		expect(stripFrontmatter("---\npublished: true\n---\nReal body")).toBe(
			"Real body",
		);
	});
});
