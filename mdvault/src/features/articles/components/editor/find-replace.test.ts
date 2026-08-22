import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { findTextMatches } from "#/features/articles/components/editor/find-replace-extension";

describe("find and replace matching", () => {
	it("finds every case-insensitive text occurrence", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Vault vault VAULT" }],
					},
				],
			},
		});

		const matches = findTextMatches(editor.state.doc, "vault");
		expect(matches).toHaveLength(3);
		expect(matches.map(({ to, from }) => to - from)).toEqual([5, 5, 5]);
		editor.destroy();
	});

	it("finds text split across formatting marks", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", text: "mark" },
							{
								type: "text",
								marks: [{ type: "bold" }],
								text: "down",
							},
						],
					},
				],
			},
		});

		expect(findTextMatches(editor.state.doc, "markdown")).toHaveLength(1);
		editor.destroy();
	});

	it("keeps source offsets aligned when Unicode case folding expands", () => {
		const editor = new Editor({
			extensions: [StarterKit],
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "İstanbul vault" }],
					},
				],
			},
		});

		expect(findTextMatches(editor.state.doc, "vault")).toHaveLength(1);
		editor.destroy();
	});
});
