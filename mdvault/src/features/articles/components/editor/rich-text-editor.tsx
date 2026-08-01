import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useImperativeHandle } from "react";
import { CodeBlockExtension } from "#/features/articles/components/editor/code-block-extension";
import { PrivateImageExtension } from "#/features/articles/components/editor/private-image-extension";
import { SelectionMenu } from "#/features/articles/components/editor/selection-menu";
import { EditorToolbar } from "#/features/articles/components/editor/toolbar";

export interface RichTextEditorHandle {
	getMarkdown: () => string;
	setMarkdown: (markdown: string) => void;
	insertMarkdown: (markdown: string) => void;
}

interface RichTextEditorProps {
	markdown: string;
	onChange?: (markdown: string) => void;
	onImageUpload?: (file: File) => Promise<string>;
	onImageInsertClick?: () => void;
}

export const RichTextEditor = forwardRef<
	RichTextEditorHandle,
	RichTextEditorProps
>(({ markdown, onChange, onImageUpload, onImageInsertClick }, ref) => {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3, 4, 5, 6] },
				link: { openOnClick: false },
				codeBlock: false,
			}),
			CodeBlockExtension,
			Markdown,
			Placeholder.configure({ placeholder: "Start writing your article..." }),
			TableKit.configure({ table: { resizable: false } }),
			PrivateImageExtension,
		],
		content: markdown,
		contentType: "markdown",
		editorProps: {
			attributes: {
				class:
					"tiptap-editor mx-auto w-full max-w-3xl px-8 py-6 focus:outline-none",
			},
			handlePaste: (_view, event) => {
				const file = extractImageFile(event.clipboardData?.files);
				if (file && onImageUpload) {
					event.preventDefault();
					void uploadAndInsert(file);
					return true;
				}
				return false;
			},
			handleDrop: (_view, event) => {
				const file = extractImageFile(event.dataTransfer?.files);
				if (file && onImageUpload) {
					event.preventDefault();
					void uploadAndInsert(file);
					return true;
				}
				return false;
			},
		},
		onUpdate: ({ editor: current }) => {
			onChange?.(current.getMarkdown());
		},
	});

	async function uploadAndInsert(file: File) {
		if (!onImageUpload || !editor) {
			return;
		}
		const url = await onImageUpload(file);
		editor.chain().focus().setImage({ src: url }).run();
	}

	useImperativeHandle(
		ref,
		() => ({
			getMarkdown: () => editor?.getMarkdown() ?? "",
			setMarkdown: (value: string) => {
				editor?.commands.setContent(value, { contentType: "markdown" });
			},
			insertMarkdown: (value: string) => {
				editor
					?.chain()
					.focus()
					.insertContent(value, { contentType: "markdown" })
					.run();
			},
		}),
		[editor],
	);

	if (!editor) {
		return (
			<div className="flex flex-1 items-center justify-center bg-muted/30">
				<span className="text-sm text-muted-foreground">Loading editor...</span>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<EditorToolbar editor={editor} onImageInsertClick={onImageInsertClick} />
			<SelectionMenu editor={editor} />
			<div className="min-h-0 flex-1 overflow-y-auto">
				<EditorContent editor={editor} className="h-full" />
			</div>
		</div>
	);
});

RichTextEditor.displayName = "RichTextEditor";

function extractImageFile(files: FileList | undefined | null) {
	if (!files) {
		return null;
	}
	for (const file of files) {
		if (file.type.startsWith("image/")) {
			return file;
		}
	}
	return null;
}
