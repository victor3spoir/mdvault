import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Placeholder, UndoRedo } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import { forwardRef, useImperativeHandle } from "react";
import { EditorLoading } from "#/components/editor-loading";

export interface PlainTextEditorHandle {
	getMarkdown: () => string;
	setMarkdown: (value: string) => void;
}

interface PlainTextEditorProps {
	markdown: string;
	placeholder?: string;
	onChange?: (value: string) => void;
}

/**
 * Builds the document from raw text, one paragraph per line.
 *
 * Going through Markdown here would be wrong: Markdown collapses single line
 * breaks and reserves blank lines for paragraphs, so a post could never contain
 * a plain line break, and every paragraph came back separated by a blank line.
 */
export function textToDocument(value: string) {
	const lines = value.replace(/\r\n/g, "\n").split("\n");

	return {
		type: "doc",
		content: lines.map((line) => ({
			type: "paragraph",
			...(line.length > 0 ? { content: [{ type: "text", text: line }] } : {}),
		})),
	};
}

/**
 * Serializes back to raw text. `blockSeparator: "\n"` is what makes the round
 * trip exact: what the author typed is what gets committed, line breaks
 * included.
 */
function documentToText(editor: { getText: (options?: object) => string }) {
	return editor.getText({ blockSeparator: "\n" });
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
			Placeholder.configure({
				placeholder: placeholder ?? "Write your post...",
			}),
		],
		content: textToDocument(markdown),
		editorProps: {
			attributes: {
				class:
					"tiptap-plain w-full px-6 py-5 text-base leading-7 focus:outline-none",
			},
		},
		onUpdate: ({ editor: current }) => {
			onChange?.(documentToText(current));
		},
	});

	useImperativeHandle(
		ref,
		() => ({
			getMarkdown: () => (editor ? documentToText(editor) : ""),
			setMarkdown: (value: string) => {
				editor?.commands.setContent(textToDocument(value));
			},
		}),
		[editor],
	);

	if (!editor) {
		return <EditorLoading />;
	}

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<EditorContent editor={editor} className="h-full" />
		</div>
	);
});

PlainTextEditor.displayName = "PlainTextEditor";
