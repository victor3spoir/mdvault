import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Placeholder, UndoRedo } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import { forwardRef, useImperativeHandle } from "react";

export interface PlainTextEditorHandle {
	getMarkdown: () => string;
	setMarkdown: (markdown: string) => void;
}

interface PlainTextEditorProps {
	markdown: string;
	placeholder?: string;
	onChange?: (markdown: string) => void;
}

/**
 * Minimal text-only editor for short-form posts. Paragraphs, line breaks and
 * undo/redo only — no headings, marks, lists, images, or code. Pasted rich
 * content degrades to plain text.
 */
export const PlainTextEditor = forwardRef<
	PlainTextEditorHandle,
	PlainTextEditorProps
>(({ markdown, placeholder, onChange }, ref) => {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			Document,
			Paragraph,
			Text,
			HardBreak,
			UndoRedo,
			Markdown,
			Placeholder.configure({
				placeholder: placeholder ?? "Write your post...",
			}),
		],
		content: markdown,
		contentType: "markdown",
		editorProps: {
			attributes: {
				class:
					"tiptap-plain w-full px-6 py-5 text-base leading-7 focus:outline-none",
			},
		},
		onUpdate: ({ editor: current }) => {
			onChange?.(current.getMarkdown());
		},
	});

	useImperativeHandle(
		ref,
		() => ({
			getMarkdown: () => editor?.getMarkdown() ?? "",
			setMarkdown: (value: string) => {
				editor?.commands.setContent(value, { contentType: "markdown" });
			},
		}),
		[editor],
	);

	if (!editor) {
		return (
			<div className="flex flex-1 items-center justify-center bg-muted/30 py-12">
				<span className="text-sm text-muted-foreground">Loading editor...</span>
			</div>
		);
	}

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<EditorContent editor={editor} className="h-full" />
		</div>
	);
});

PlainTextEditor.displayName = "PlainTextEditor";
