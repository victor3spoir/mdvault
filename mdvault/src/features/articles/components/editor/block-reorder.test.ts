import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import {
	currentTopLevelBlockPosition,
	moveTopLevelBlock,
} from "#/features/articles/components/editor/block-reorder";

describe("keyboard block reordering", () => {
	it("moves a top-level block down", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "First" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Second" }],
					},
				],
			},
		});

		expect(moveTopLevelBlock(editor, 0, 1)).toBe(true);
		expect(editor.getText({ blockSeparator: "|" })).toBe("Second|First");
		editor.destroy();
	});

	it("does not move a block beyond the document boundary", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Only" }],
					},
				],
			},
		});

		expect(moveTopLevelBlock(editor, 0, -1)).toBe(false);
		editor.destroy();
	});

	it("locates the selected top-level block for keyboard controls", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "First" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Second" }],
					},
				],
			},
		});
		editor.commands.setTextSelection(8);

		expect(currentTopLevelBlockPosition(editor)).toBe(7);
		expect(
			moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), -1),
		).toBe(true);
		expect(editor.getText({ blockSeparator: "|" })).toBe("Second|First");
		editor.destroy();
	});

	it("keeps the selection with a block across repeated moves", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "First" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Second" }],
					},
					{
						type: "paragraph",
						content: [{ type: "text", text: "Third" }],
					},
				],
			},
		});
		editor.commands.setTextSelection(2);

		expect(
			moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), 1),
		).toBe(true);
		expect(
			moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), 1),
		).toBe(true);
		expect(editor.getText({ blockSeparator: "|" })).toBe("Second|Third|First");
		editor.destroy();
	});
});
