import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { EditorLoading } from "#/components/editor-loading";
import { Button } from "#/components/ui/button";
import { BlockDragControls } from "#/features/articles/components/editor/block-drag-controls";
import {
	currentTopLevelBlockPosition,
	deleteTopLevelBlock,
	moveTopLevelBlock,
} from "#/features/articles/components/editor/block-reorder";
import { CalloutExtension } from "#/features/articles/components/editor/callout-extension";
import { CodeBlockExtension } from "#/features/articles/components/editor/code-block-extension";
import { ContentChecksPopover } from "#/features/articles/components/editor/content-checks-popover";
import { FindReplaceBar } from "#/features/articles/components/editor/find-replace-bar";
import { FindReplaceExtension } from "#/features/articles/components/editor/find-replace-extension";
import { HeadingExtension } from "#/features/articles/components/editor/heading-extension";
import { MediaEmbedExtension } from "#/features/articles/components/editor/media-embed-extension";
import {
	normalizePastedText,
	sanitizePastedHtml,
} from "#/features/articles/components/editor/paste-cleanup";
import { PrivateImageExtension } from "#/features/articles/components/editor/private-image-extension";
import { SelectionMenu } from "#/features/articles/components/editor/selection-menu";
import { createSlashCommandExtension } from "#/features/articles/components/editor/slash-command-extension";
import { TableMenu } from "#/features/articles/components/editor/table-menu";
import { EditorToolbar } from "#/features/articles/components/editor/toolbar";

export interface RichTextEditorHandle {
	getMarkdown: () => string;
	setMarkdown: (markdown: string, emitUpdate?: boolean) => void;
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
	const [findOpen, setFindOpen] = useState(false);
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: false,
				link: { openOnClick: false },
				codeBlock: false,
			}),
			HeadingExtension,
			CodeBlockExtension,
			Markdown,
			Placeholder.configure({ placeholder: "Start writing your article..." }),
			TableKit.configure({ table: { resizable: false } }),
			TaskList,
			TaskItem.configure({ nested: true }),
			PrivateImageExtension,
			CalloutExtension,
			MediaEmbedExtension,
			CharacterCount,
			FindReplaceExtension,
			createSlashCommandExtension(onImageInsertClick),
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
			transformPastedHTML: (html, view) =>
				view.state.selection.$from.parent.type.name === "codeBlock"
					? html
					: sanitizePastedHtml(html),
			transformPastedText: (text, _plain, view) =>
				view.state.selection.$from.parent.type.name === "codeBlock"
					? text
					: normalizePastedText(text),
		},
		onUpdate: ({ editor: current }) => {
			onChange?.(current.getMarkdown());
		},
	});

	useEffect(() => {
		if (!editor) {
			return;
		}
		const handleShortcut = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
				event.preventDefault();
				setFindOpen(true);
			}
		};
		const element = editor.view.dom;
		element.addEventListener("keydown", handleShortcut);
		return () => element.removeEventListener("keydown", handleShortcut);
	}, [editor]);

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
			setMarkdown: (value: string, emitUpdate = true) => {
				editor?.commands.setContent(value, {
					contentType: "markdown",
					emitUpdate,
				});
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
		return <EditorLoading withToolbar />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<EditorToolbar
				editor={editor}
				onImageInsertClick={onImageInsertClick}
				onFindClick={() => setFindOpen((value) => !value)}
				findOpen={findOpen}
			/>
			{findOpen ? (
				<FindReplaceBar editor={editor} onClose={() => setFindOpen(false)} />
			) : null}
			<SelectionMenu editor={editor} />
			<TableMenu editor={editor} />
			<div className="relative min-h-0 flex-1 overflow-y-auto">
				<BlockDragControls editor={editor} />
				<EditorContent editor={editor} className="h-full" />
			</div>
			<EditorCounts editor={editor} />
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

function EditorCounts({
	editor,
}: {
	editor: NonNullable<ReturnType<typeof useEditor>>;
}) {
	const counts = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			words: current.storage.characterCount.words(),
			characters: current.storage.characterCount.characters(),
		}),
	});

	return (
		<div className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-3 py-1 text-[11px] tabular-nums text-muted-foreground">
			<div className="flex items-center gap-1">
				<button
					type="button"
					className="flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40"
					aria-label="Move current block up"
					title="Move current block up"
					onClick={() =>
						moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), -1)
					}
				>
					<IconArrowUp className="size-3.5" />
				</button>
				<button
					type="button"
					className="flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:opacity-40"
					aria-label="Move current block down"
					title="Move current block down"
					onClick={() =>
						moveTopLevelBlock(editor, currentTopLevelBlockPosition(editor), 1)
					}
				>
					<IconArrowDown className="size-3.5" />
				</button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="size-7"
					aria-label="Delete current block"
					title="Delete current block (Undo to restore)"
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => {
						if (
							deleteTopLevelBlock(editor, currentTopLevelBlockPosition(editor))
						) {
							editor.commands.focus();
						}
					}}
				>
					<IconTrash />
				</Button>
			</div>
			<div className="flex items-center gap-3">
				<ContentChecksPopover editor={editor} />
				<span className="flex h-7 items-center leading-none">
					{counts.words.toLocaleString()} words
				</span>
				<span className="flex h-7 items-center leading-none">
					{counts.characters.toLocaleString()} characters
				</span>
			</div>
		</div>
	);
}
