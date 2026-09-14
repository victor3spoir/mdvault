// @vitest-environment jsdom
import { Editor, type JSONContent } from "@tiptap/core";
import type { DragHandleProps } from "@tiptap/extension-drag-handle-react";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { BlockDragControls } from "#/features/articles/components/editor/block-drag-controls";
import { CalloutExtension } from "#/features/articles/components/editor/callout-extension";

const handle = vi.hoisted(() => ({
	onNodeChange: undefined as DragHandleProps["onNodeChange"],
}));
vi.mock("@tiptap/extension-drag-handle-react", () => ({
	default: (props: DragHandleProps) => {
		handle.onNodeChange = props.onNodeChange;
		return props.children;
	},
}));
const paragraph = (text: string): JSONContent => ({
	type: "paragraph",
	content: [{ type: "text", text }],
});

it.each<JSONContent>([
	paragraph("Hovered paragraph"),
	{ type: "image", attrs: { src: "/example.png" } },
	{ type: "callout", content: [paragraph("Note")] },
	{ type: "codeBlock", content: [{ type: "text", text: "Code" }] },
	{ type: "horizontalRule" },
	{
		type: "table",
		content: [
			{
				type: "tableRow",
				content: [{ type: "tableCell", content: [paragraph("Cell")] }],
			},
		],
	},
])("deletes the hovered $type rather than the cursor block", async (block) => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	const editor = new Editor({
		extensions: [StarterKit, Image, TableKit, CalloutExtension],
		content: {
			type: "doc",
			content: [paragraph("Keep"), block, paragraph("After")],
		},
	});
	const original = editor.getJSON();
	const container = document.createElement("div");
	const root = createRoot(container);
	try {
		await act(async () => {
			root.render(createElement(BlockDragControls, { editor }));
		});
		const pos = editor.state.doc.firstChild?.nodeSize ?? 0;
		handle.onNodeChange?.({ editor, pos, node: editor.state.doc.nodeAt(pos) });
		const button = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Delete block"]',
		);
		expect(button).not.toBeNull();
		await act(async () => {
			button?.click();
		});
		expect(editor.getText({ blockSeparator: "|" })).toBe("Keep|After");
		await act(async () => {
			editor.commands.undo();
		});
		expect(editor.getJSON()).toEqual(original);
		handle.onNodeChange?.({ editor, pos: -1, node: null });
		await act(async () => {
			button?.click();
		});
		expect(editor.getJSON()).toEqual(original);
	} finally {
		await act(async () => {
			root.unmount();
			editor.destroy();
		});
		vi.unstubAllGlobals();
	}
});
