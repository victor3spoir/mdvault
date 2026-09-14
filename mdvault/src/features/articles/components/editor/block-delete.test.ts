// @vitest-environment jsdom
import { Editor, type JSONContent } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import {
	currentTopLevelBlockPosition,
	deleteTopLevelBlock,
	moveTopLevelBlock,
} from "#/features/articles/components/editor/block-reorder";
import { CalloutExtension } from "#/features/articles/components/editor/callout-extension";
import { MediaEmbedExtension } from "#/features/articles/components/editor/media-embed-extension";

const paragraph = (text: string): JSONContent => ({
	type: "paragraph",
	content: [{ type: "text", text }],
});
const editors: Editor[] = [];

function makeEditor(content: JSONContent[]) {
	const editor = new Editor({
		extensions: [
			StarterKit,
			Image,
			TableKit,
			CalloutExtension,
			MediaEmbedExtension,
		],
		content: { type: "doc", content },
	});
	editors.push(editor);
	return editor;
}

afterEach(() => {
	for (const editor of editors.splice(0)) editor.destroy();
});

describe("block deletion", () => {
	it.each<JSONContent>([
		paragraph("Delete me"),
		{
			type: "heading",
			attrs: { level: 2 },
			content: [{ type: "text", text: "Heading" }],
		},
		{ type: "image", attrs: { src: "/test.png", alt: "Example" } },
		{ type: "horizontalRule" },
		{ type: "codeBlock", content: [{ type: "text", text: "const x = 1" }] },
		{
			type: "callout",
			attrs: { type: "warning" },
			content: [paragraph("Warning")],
		},
		{ type: "blockquote", content: [paragraph("Quote")] },
		{
			type: "bulletList",
			content: [{ type: "listItem", content: [paragraph("Item")] }],
		},
		{
			type: "table",
			content: [
				{
					type: "tableRow",
					content: [{ type: "tableCell", content: [paragraph("Cell")] }],
				},
			],
		},
		{ type: "mediaEmbed", attrs: { src: "https://youtu.be/dQw4w9WgXcQ" } },
	])("deletes a $type without touching adjacent blocks and supports undo", (block) => {
		const editor = makeEditor([paragraph("Before"), block, paragraph("After")]);
		const original = editor.getJSON();
		const position = editor.state.doc.firstChild?.nodeSize ?? 0;
		expect(deleteTopLevelBlock(editor, position)).toBe(true);
		expect(editor.getText({ blockSeparator: "|" })).toBe("Before|After");
		expect(editor.commands.undo()).toBe(true);
		expect(editor.getJSON()).toEqual(original);
		expect(editor.commands.redo()).toBe(true);
		expect(editor.getText({ blockSeparator: "|" })).toBe("Before|After");
	});

	it("deletes the selected image, not the paragraph next to it", () => {
		const editor = makeEditor([
			{ type: "image", attrs: { src: "/test.png" } },
			paragraph("Keep"),
		]);
		editor.commands.setNodeSelection(0);
		expect(currentTopLevelBlockPosition(editor)).toBe(0);
		expect(
			deleteTopLevelBlock(editor, currentTopLevelBlockPosition(editor)),
		).toBe(true);
		expect(editor.getText()).toBe("Keep");
	});

	it("resolves a cursor inside a nested callout to its containing block", () => {
		const editor = makeEditor([
			{ type: "callout", content: [paragraph("Note")] },
			paragraph("Keep"),
		]);
		editor.commands.setTextSelection(3);
		expect(
			deleteTopLevelBlock(editor, currentTopLevelBlockPosition(editor)),
		).toBe(true);
		expect(editor.getText()).toBe("Keep");
	});

	it("keeps an editable paragraph after deleting the only block", () => {
		const editor = makeEditor([paragraph("Only")]);
		expect(deleteTopLevelBlock(editor, 0)).toBe(true);
		expect(editor.getJSON().content).toEqual([{ type: "paragraph" }]);
		expect(editor.commands.undo()).toBe(true);
		expect(editor.getText()).toBe("Only");
	});

	it("rejects invalid positions and read-only edits", () => {
		const editor = makeEditor([paragraph("Keep")]);
		for (const position of [-1, 1, 100, editor.state.doc.content.size]) {
			expect(deleteTopLevelBlock(editor, position)).toBe(false);
		}
		editor.setEditable(false);
		expect(deleteTopLevelBlock(editor, 0)).toBe(false);
		expect(editor.getText()).toBe("Keep");
	});

	it("keeps image node selections valid when using the adjacent move controls", () => {
		const editor = makeEditor([
			{ type: "image", attrs: { src: "/test.png" } },
			paragraph("Keep"),
		]);
		editor.commands.setNodeSelection(0);
		expect(
			moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), 1),
		).toBe(true);
		expect(editor.state.selection).toBeInstanceOf(NodeSelection);
		expect(
			deleteTopLevelBlock(editor, currentTopLevelBlockPosition(editor)),
		).toBe(true);
		expect(editor.getText().trim()).toBe("Keep");
		expect(
			editor.getJSON().content?.every((node) => node.type === "paragraph"),
		).toBe(true);
	});
});
