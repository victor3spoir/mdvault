// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodeBlockExtension } from "#/features/articles/components/editor/code-block-extension";
import { MarkdownContent } from "#/features/content/components/markdown-content";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const source = 'echo "<hello> & goodbye"\n\tprintf \'%s\\n\' "$HOME"';
const fence = String.fromCharCode(96).repeat(3);
function fenced(language: string) {
	return `${fence + language}\n${source}\n${fence}`;
}
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let editor: Editor | undefined;
let clipboardDescriptor: PropertyDescriptor | undefined;
const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { writeText },
	});
	writeText.mockReset().mockResolvedValue();
	vi.mocked(toast.error).mockClear();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => {
		root.unmount();
		editor?.destroy();
	});
	editor = undefined;
	container.remove();
	vi.useRealTimers();
	if (clipboardDescriptor) {
		Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
	} else {
		Reflect.deleteProperty(navigator, "clipboard");
	}
	vi.unstubAllGlobals();
});

function copyButton() {
	const button = container.querySelector<HTMLButtonElement>(
		".code-block-header button",
	);
	if (!button) throw new Error("Missing code copy button");
	return button;
}

async function renderPreview() {
	await act(async () => {
		root.render(createElement(MarkdownContent, { source: fenced("bash") }));
	});
}

describe("shared code block interactions", () => {
	it("copies highlighted source without the language header and resets feedback", async () => {
		await renderPreview();
		vi.useFakeTimers();
		await act(async () => copyButton().click());
		expect(writeText).toHaveBeenCalledWith(
			container.querySelector("pre code")?.textContent,
		);
		expect(writeText.mock.calls[0][0].trimEnd()).toBe(source);
		expect(copyButton().getAttribute("aria-label")).toBe("Code copied");
		await act(async () => vi.advanceTimersByTime(2000));
		expect(copyButton().getAttribute("aria-label")).toBe("Copy code");
	});

	it("reports clipboard failures without showing successful copy feedback", async () => {
		await renderPreview();
		writeText.mockRejectedValueOnce(new Error("Clipboard unavailable"));
		await act(async () => copyButton().click());
		expect(toast.error).toHaveBeenCalledWith(
			"Could not copy code. Please try again.",
		);
		expect(copyButton().getAttribute("aria-label")).toBe("Copy code");
	});

	it("cancels pending copy feedback when a preview is removed", async () => {
		await renderPreview();
		vi.useFakeTimers();
		await act(async () => copyButton().click());
		await act(async () => root.render(null));
		expect(vi.getTimerCount()).toBe(0);
	});

	it.each([
		"python",
		"powershell",
		"pwsh",
	])("keeps %s language controls out of Markdown and copies current edits", async (selectedLanguage) => {
		await act(async () => {
			editor = new Editor({
				extensions: [
					StarterKit.configure({ codeBlock: false }),
					Markdown,
					CodeBlockExtension,
				],
				content: fenced("sh"),
				contentType: "markdown",
				editorProps: { attributes: { class: "tiptap-editor" } },
			});
			root.render(createElement(EditorContent, { editor }));
		});
		const language = container.querySelector<HTMLSelectElement>(
			'select[aria-label="Code block language"]',
		);
		expect(language?.value).toBe("sh");
		expect(
			container
				.querySelector(".code-block-header")
				?.getAttribute("contenteditable"),
		).toBe("false");
		expect(container.querySelector("pre code")?.textContent).toBe(source);
		await act(async () => {
			if (!language) throw new Error("Missing language selector");
			language.value = selectedLanguage;
			language.dispatchEvent(new Event("change", { bubbles: true }));
		});
		expect(editor?.getMarkdown()).toContain(fenced(selectedLanguage));
		expect(editor?.getMarkdown()).not.toContain("Copy code");
		await act(async () => {
			editor?.commands.insertContentAt(1, "# Edited\n");
		});
		await act(async () => copyButton().click());
		expect(writeText).toHaveBeenLastCalledWith(`# Edited\n${source}`);
	});
});
