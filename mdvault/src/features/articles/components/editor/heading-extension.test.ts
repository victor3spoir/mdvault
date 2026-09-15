// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { HeadingExtension } from "./heading-extension";

function createEditor(
	content: string,
	contentType: "markdown" | "html" = "markdown",
) {
	return new Editor({
		extensions: [
			StarterKit.configure({ heading: false }),
			HeadingExtension,
			Markdown,
		],
		content,
		contentType,
	});
}

describe("editor heading levels", () => {
	it("allows H4 authoring but rejects H5 and H6 commands and shortcuts", () => {
		const editor = createEditor("Section");
		try {
			expect(editor.commands.setHeading({ level: 4 })).toBe(true);
			expect(editor.commands.setHeading({ level: 5 })).toBe(false);
			expect(editor.commands.toggleHeading({ level: 6 })).toBe(false);
			editor.commands.keyboardShortcut("Mod-Alt-5");
			editor.commands.keyboardShortcut("Mod-Alt-6");
			expect(editor.getMarkdown().trimEnd()).toBe("#### Section");
		} finally {
			editor.destroy();
		}
	});

	it("preserves legacy heading levels when loading and saving Markdown", () => {
		const source = "#### Four\n\n##### Five\n\n###### Six";
		const editor = createEditor(source);
		try {
			expect(editor.getMarkdown()).toBe(source);
			expect(editor.getHTML()).toBe("<h4>Four</h4><h5>Five</h5><h6>Six</h6>");
		} finally {
			editor.destroy();
		}
	});

	it("preserves legacy headings from HTML without promoting them to H2", () => {
		const source = "<h5>Five</h5><h6>Six</h6>";
		const editor = createEditor(source, "html");
		try {
			expect(editor.getHTML()).toBe(source);
			expect(editor.getMarkdown()).toBe("##### Five\n\n###### Six");
		} finally {
			editor.destroy();
		}
	});
});
