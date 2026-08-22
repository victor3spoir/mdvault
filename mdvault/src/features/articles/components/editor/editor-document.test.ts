import { describe, expect, it } from "vitest";
import {
	analyzeEditorDocument,
	type EditorDocumentNode,
	extractEditorOutline,
	isSafeEditorHref,
} from "./editor-document";

describe("extractEditorOutline", () => {
	it("extracts H2-H6 headings with unique slugs and ProseMirror positions", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Résumé" }],
				},
				{
					type: "paragraph",
					content: [{ type: "text", text: "Body" }],
				},
				{
					type: "heading",
					attrs: { level: 3 },
					content: [{ type: "text", text: "Resume" }],
				},
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Ignored" }],
				},
			],
		};

		expect(extractEditorOutline(document)).toEqual([
			{ text: "Résumé", level: 2, slug: "resume", position: 0 },
			{ text: "Resume", level: 3, slug: "resume-2", position: 14 },
		]);
	});

	it("tracks headings nested inside other document nodes", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "blockquote",
					content: [
						{
							type: "heading",
							attrs: { level: 4 },
							content: [{ type: "text", text: "Nested" }],
						},
					],
				},
			],
		};

		expect(extractEditorOutline(document)[0]?.position).toBe(1);
	});
});

describe("analyzeEditorDocument", () => {
	it("reports missing and generic image alt text at image positions", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{ type: "image", attrs: { src: "/cover.png", alt: "" } },
				{ type: "image", attrs: { src: "/chart.png", alt: "image 2" } },
				{
					type: "image",
					attrs: { src: "/team.png", alt: "The MDVault team" },
				},
			],
		};

		expect(analyzeEditorDocument(document)).toMatchObject([
			{ type: "missing-image-alt", position: 0 },
			{ type: "generic-image-alt", position: 1 },
		]);
	});

	it("reports duplicate normalized headings and broken fragments", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Déjà Vu" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "missing",
							marks: [{ type: "link", attrs: { href: "#not-here" } }],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 3 },
					content: [{ type: "text", text: "Deja vu" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "second",
							marks: [{ type: "link", attrs: { href: "#deja-vu-2" } }],
						},
					],
				},
			],
		};

		expect(analyzeEditorDocument(document)).toMatchObject([
			{ type: "broken-fragment-link", position: 10 },
			{ type: "duplicate-heading", position: 18 },
		]);
	});

	it("reports empty and unsafe links", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "empty",
							marks: [{ type: "link", attrs: { href: " " } }],
						},
						{
							type: "text",
							text: "unsafe",
							marks: [
								{ type: "link", attrs: { href: "java\nscript:alert(1)" } },
							],
						},
					],
				},
			],
		};

		expect(analyzeEditorDocument(document)).toMatchObject([
			{ type: "empty-link-href", position: 1 },
			{ type: "unsafe-link-href", position: 6 },
		]);
	});

	it("allows relative public routes", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "public",
							marks: [{ type: "link", attrs: { href: "/pricing" } }],
						},
					],
				},
			],
		};

		expect(analyzeEditorDocument(document)).toEqual([]);
	});

	it("coalesces a link split across adjacent marked text nodes", () => {
		const document: EditorDocumentNode = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "mark",
							marks: [{ type: "link", attrs: { href: "#missing" } }],
						},
						{
							type: "text",
							text: "down",
							marks: [
								{ type: "bold" },
								{ type: "link", attrs: { href: "#missing" } },
							],
						},
					],
				},
			],
		};

		expect(analyzeEditorDocument(document)).toHaveLength(1);
	});
});

describe("isSafeEditorHref", () => {
	it("accepts normal web, mail, fragment, and relative links", () => {
		expect(isSafeEditorHref("https://example.com")).toBe(true);
		expect(isSafeEditorHref("mailto:editor@example.com")).toBe(true);
		expect(isSafeEditorHref("#outline")).toBe(true);
		expect(isSafeEditorHref("../article")).toBe(true);
	});

	it("rejects executable and data protocols", () => {
		expect(isSafeEditorHref("javascript:alert(1)")).toBe(false);
		expect(isSafeEditorHref("java\u0000script:alert(1)")).toBe(false);
		expect(isSafeEditorHref("data:text/html,hello")).toBe(false);
	});
});
