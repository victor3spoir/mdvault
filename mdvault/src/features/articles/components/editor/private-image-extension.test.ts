// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { PrivateImageExtension } from "#/features/articles/components/editor/private-image-extension";
import type { MediaFile } from "#/features/media/media.types";

vi.mock("#/features/media/components/image-insert-dialog", () => ({
	ImageInsertDialog: ({
		onSelect,
		onClose,
	}: {
		onSelect: (image: MediaFile) => void;
		onClose: () => void;
	}) =>
		createElement(
			"div",
			{ role: "dialog" },
			createElement(
				"button",
				{
					type: "button",
					onClick: () => onSelect({ url: "/replacement.png" } as MediaFile),
				},
				"Choose replacement",
			),
			createElement(
				"button",
				{ type: "button", onClick: onClose },
				"Cancel replacement",
			),
		),
}));

it("replaces an image in place, preserves its metadata, cancels safely and supports undo and deletion", async () => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	const editor = new Editor({
		extensions: [StarterKit, Markdown, PrivateImageExtension],
		content:
			'![Original alt](/original.png#w=50&align=left "Original caption")\n\nKeep this paragraph.',
		contentType: "markdown",
	});
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	async function selectImage() {
		await act(async () => {
			editor.commands.setNodeSelection(0);
			await new Promise((resolve) => requestAnimationFrame(resolve));
		});
	}
	async function click(label: string) {
		const button = [...container.querySelectorAll("button")].find(
			(item) =>
				item.getAttribute("aria-label") === label || item.textContent === label,
		);
		expect(button).toBeDefined();
		await act(async () => {
			button?.click();
		});
	}
	try {
		await act(async () => {
			root.render(createElement(EditorContent, { editor }));
		});
		await selectImage();
		const original = editor.getJSON();
		await click("Replace image");
		await click("Cancel replacement");
		expect(editor.getJSON()).toEqual(original);
		await click("Replace image");
		await click("Choose replacement");
		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "image",
			attrs: {
				src: "/replacement.png",
				alt: "Original alt",
				title: "Original caption",
				width: 50,
				align: "left",
			},
		});
		expect(editor.getJSON().content).toHaveLength(
			original.content?.length ?? 0,
		);
		expect(editor.getMarkdown()).toContain(
			'/replacement.png#w=50&align=left "Original caption"',
		);
		await act(async () => {
			editor.commands.undo();
		});
		expect(editor.getJSON()).toEqual(original);
		await selectImage();
		await click("Delete image");
		expect(editor.getMarkdown()).not.toContain("original.png");
		expect(editor.getText()).toContain("Keep this paragraph.");
		await act(async () => {
			editor.commands.undo();
		});
		expect(editor.getJSON()).toEqual(original);
	} finally {
		await act(async () => {
			root.unmount();
			editor.destroy();
		});
		container.remove();
		vi.unstubAllGlobals();
	}
});
