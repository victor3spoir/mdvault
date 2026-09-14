// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { textToDocument } from "./plain-text-editor";
import { PostContent } from "./post-content";

describe("plain post rendering", () => {
	it.each([
		"",
		"Une ligne\nLa suivante",
		"\nUne idée 💡\n\n\nDeuxième idée\n",
		"  Espaces   conservés\n   \nhttps://example.com/article",
		"Un post\r\n\r\nSous Windows",
	])("mirrors the editor's lines, blanks and spaces: %j", (content) => {
		const editor = new Editor({
			extensions: [Document, Paragraph, Text, HardBreak],
			content: textToDocument(content),
		});
		const preview = document.createElement("div");
		preview.innerHTML = renderToStaticMarkup(
			createElement(PostContent, { content }),
		);
		try {
			const lines = content.replace(/\r\n/g, "\n").split("\n");
			expect(editor.getText({ blockSeparator: "\n" })).toBe(lines.join("\n"));
			expect(
				Array.from(preview.querySelectorAll("p"), (line) => line.textContent),
			).toEqual(lines);
			expect(
				Array.from(
					editor.view.dom.querySelectorAll("p"),
					(line) => line.textContent,
				),
			).toEqual(lines);
			expect(preview.querySelector(".plain-text-content")).not.toBeNull();
			expect(preview.querySelectorAll("br")).toHaveLength(
				lines.filter((line) => line === "").length,
			);
		} finally {
			editor.destroy();
		}
	});

	it.each([
		"<script>alert(1)</script>",
		"<SCRIPT>alert(1)</SCRIPT>",
		"<ScRiPt >alert(1)</ScRiPt>",
	])("keeps Markdown literal and escapes HTML in social copy: %s", (script) => {
		const content = `## Topic\n**Not bold**\n${script}`;
		const html = renderToStaticMarkup(createElement(PostContent, { content }));
		const preview = document.createElement("div");
		preview.innerHTML = html;
		expect(preview.querySelector("h2, strong, script")).toBeNull();
		expect(
			Array.from(preview.querySelectorAll("p"), (line) => line.textContent),
		).toEqual(content.split("\n"));
	});
});
