// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { TooltipProvider } from "#/components/ui/tooltip";
import { CalloutExtension } from "#/features/articles/components/editor/callout-extension";
import { EditorToolbar } from "#/features/articles/components/editor/toolbar";

it("inserts a portable callout from the toolbar and updates its active state", async () => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	const editor = new Editor({
		extensions: [StarterKit, Markdown, CalloutExtension],
		content: "",
		contentType: "markdown",
	});
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	try {
		await act(async () => {
			root.render(
				createElement(
					TooltipProvider,
					null,
					createElement(EditorToolbar, { editor }),
				),
			);
		});
		const button = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Insert callout"]',
		);
		expect(button).not.toBeNull();
		await act(async () => {
			button?.click();
		});
		expect(editor.getJSON().content?.[0]).toMatchObject({
			type: "callout",
			attrs: { type: "note" },
		});
		expect(editor.getMarkdown()).toContain("> [!NOTE]");
		expect(button?.getAttribute("aria-pressed")).toBe("true");
		await act(async () => {
			editor.commands.undo();
		});
		expect(editor.getText()).toBe("");
		expect(button?.getAttribute("aria-pressed")).toBe("false");
	} finally {
		await act(async () => {
			root.unmount();
			editor.destroy();
		});
		container.remove();
		vi.unstubAllGlobals();
	}
});
