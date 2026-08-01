import {
	IconArrowBackUp,
	IconArrowForwardUp,
	IconBlockquote,
	IconBold,
	IconCode,
	IconH2,
	IconH3,
	IconH4,
	IconH5,
	IconH6,
	IconItalic,
	IconLink,
	IconList,
	IconListNumbers,
	IconMinus,
	IconPhoto,
	IconSourceCode,
	IconStrikethrough,
	IconTable,
	IconUnlink,
} from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import type { ReactNode } from "react";
import { Separator } from "#/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";

interface ToolbarButtonProps {
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: ReactNode;
}

function ToolbarButton({
	label,
	active,
	disabled,
	onClick,
	children,
}: ToolbarButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={label}
					aria-pressed={active}
					disabled={disabled}
					onMouseDown={(event) => event.preventDefault()}
					onClick={onClick}
					className={cn(
						"flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
						active && "bg-primary/10 text-primary",
					)}
				>
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

interface EditorToolbarProps {
	editor: Editor;
	onImageInsertClick?: () => void;
}

export function EditorToolbar({
	editor,
	onImageInsertClick,
}: EditorToolbarProps) {
	const state = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			bold: current.isActive("bold"),
			italic: current.isActive("italic"),
			strike: current.isActive("strike"),
			code: current.isActive("code"),
			h2: current.isActive("heading", { level: 2 }),
			h3: current.isActive("heading", { level: 3 }),
			h4: current.isActive("heading", { level: 4 }),
			h5: current.isActive("heading", { level: 5 }),
			h6: current.isActive("heading", { level: 6 }),
			bulletList: current.isActive("bulletList"),
			orderedList: current.isActive("orderedList"),
			blockquote: current.isActive("blockquote"),
			codeBlock: current.isActive("codeBlock"),
			link: current.isActive("link"),
			canUndo: current.can().undo(),
			canRedo: current.can().redo(),
		}),
	});

	const setLink = () => {
		const previous = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt("Link URL", previous ?? "https://");
		if (url === null) {
			return;
		}
		if (url === "") {
			editor.chain().focus().unsetLink().run();
			return;
		}
		editor.chain().focus().setLink({ href: url }).run();
	};

	return (
		<div className="flex shrink-0 flex-wrap items-center justify-center gap-0.5 border-b bg-background/95 px-3 py-1.5">
			<ToolbarButton
				label="Undo"
				disabled={!state.canUndo}
				onClick={() => editor.chain().focus().undo().run()}
			>
				<IconArrowBackUp className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Redo"
				disabled={!state.canRedo}
				onClick={() => editor.chain().focus().redo().run()}
			>
				<IconArrowForwardUp className="size-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-5" />

			<ToolbarButton
				label="Bold"
				active={state.bold}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<IconBold className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Italic"
				active={state.italic}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			>
				<IconItalic className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Strikethrough"
				active={state.strike}
				onClick={() => editor.chain().focus().toggleStrike().run()}
			>
				<IconStrikethrough className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Inline code"
				active={state.code}
				onClick={() => editor.chain().focus().toggleCode().run()}
			>
				<IconCode className="size-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-5" />

			<ToolbarButton
				label="Heading 2"
				active={state.h2}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			>
				<IconH2 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Heading 3"
				active={state.h3}
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			>
				<IconH3 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Heading 4"
				active={state.h4}
				onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
			>
				<IconH4 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Heading 5"
				active={state.h5}
				onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
			>
				<IconH5 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Heading 6"
				active={state.h6}
				onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
			>
				<IconH6 className="size-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-5" />

			<ToolbarButton
				label="Bullet list"
				active={state.bulletList}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			>
				<IconList className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Numbered list"
				active={state.orderedList}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			>
				<IconListNumbers className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Blockquote"
				active={state.blockquote}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			>
				<IconBlockquote className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Code block"
				active={state.codeBlock}
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
			>
				<IconSourceCode className="size-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-5" />

			{state.link ? (
				<ToolbarButton
					label="Remove link"
					active
					onClick={() => editor.chain().focus().unsetLink().run()}
				>
					<IconUnlink className="size-4" />
				</ToolbarButton>
			) : (
				<ToolbarButton label="Add link" onClick={setLink}>
					<IconLink className="size-4" />
				</ToolbarButton>
			)}
			<ToolbarButton
				label="Insert image from library"
				onClick={() => onImageInsertClick?.()}
			>
				<IconPhoto className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Insert table"
				onClick={() =>
					editor
						.chain()
						.focus()
						.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
						.run()
				}
			>
				<IconTable className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				label="Horizontal rule"
				onClick={() => editor.chain().focus().setHorizontalRule().run()}
			>
				<IconMinus className="size-4" />
			</ToolbarButton>
		</div>
	);
}
