import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { CalloutExtension } from "#/features/articles/components/editor/callout-extension";
import { MediaEmbedExtension } from "#/features/articles/components/editor/media-embed-extension";

function makeEditor(markdown: string) {
	return new Editor({
		extensions: [
			StarterKit.configure({ codeBlock: false }),
			Markdown,
			CalloutExtension,
			MediaEmbedExtension,
		],
		content: markdown,
		contentType: "markdown",
	});
}

describe("advanced block Markdown round trips", () => {
	it("keeps GitHub-style callouts portable", () => {
		const editor = makeEditor(
			"> [!WARNING]\n>\n> Back up the repository before continuing.\n\nContinue normally.",
		);
		const markdown = editor.getMarkdown();

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "callout",
			attrs: { type: "warning" },
		});
		expect(editor.getJSON().content?.[1]).toMatchObject({
			type: "paragraph",
		});
		expect(markdown).toContain("> [!WARNING]");
		expect(markdown).toContain("> Back up the repository");
		expect(markdown).toContain("Continue normally.");
		editor.destroy();
	});

	it("updates the serialized callout type", () => {
		const editor = makeEditor("> [!NOTE]\n>\n> Remember this.");

		editor.commands.setTextSelection(2);
		expect(editor.commands.updateAttributes("callout", { type: "tip" })).toBe(
			true,
		);
		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "callout",
			attrs: { type: "tip" },
		});
		expect(editor.getMarkdown()).toContain("> [!TIP]");
		editor.destroy();
	});

	it("keeps supported embeds as standalone URLs", () => {
		const source = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
		const editor = makeEditor(`${source}\n\nContinue normally.`);

		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "mediaEmbed",
		});
		expect(editor.getJSON().content?.[1]).toMatchObject({
			type: "paragraph",
		});
		expect(editor.getMarkdown()).toContain(source);
		expect(editor.getMarkdown()).toContain("Continue normally.");
		editor.destroy();
	});
});
