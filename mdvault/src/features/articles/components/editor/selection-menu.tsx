import {
	IconBlockquote,
	IconBold,
	IconCode,
	IconH2,
	IconH3,
	IconItalic,
	IconLink,
	IconStrikethrough,
	IconUnlink,
} from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface MenuButtonProps {
	label: string;
	active?: boolean;
	onClick: () => void;
	children: ReactNode;
}

function MenuButton({ label, active, onClick, children }: MenuButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			aria-pressed={active}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			className={cn(
				"flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				active && "bg-primary/10 text-primary",
			)}
		>
			{children}
		</button>
	);
}

interface SelectionMenuProps {
	editor: Editor;
}

export function SelectionMenu({ editor }: SelectionMenuProps) {
	const state = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			bold: current.isActive("bold"),
			italic: current.isActive("italic"),
			strike: current.isActive("strike"),
			code: current.isActive("code"),
			h2: current.isActive("heading", { level: 2 }),
			h3: current.isActive("heading", { level: 3 }),
			blockquote: current.isActive("blockquote"),
			link: current.isActive("link"),
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
		<BubbleMenu
			editor={editor}
			pluginKey="selectionMenu"
			shouldShow={({ editor: current, from, to }) =>
				from !== to && !current.isActive("codeBlock")
			}
			className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg"
		>
			<MenuButton
				label="Bold"
				active={state.bold}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<IconBold className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Italic"
				active={state.italic}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			>
				<IconItalic className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Strikethrough"
				active={state.strike}
				onClick={() => editor.chain().focus().toggleStrike().run()}
			>
				<IconStrikethrough className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Inline code"
				active={state.code}
				onClick={() => editor.chain().focus().toggleCode().run()}
			>
				<IconCode className="size-3.5" />
			</MenuButton>

			<span className="mx-0.5 h-4 w-px bg-border" />

			<MenuButton
				label="Heading 2"
				active={state.h2}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			>
				<IconH2 className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Heading 3"
				active={state.h3}
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			>
				<IconH3 className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Blockquote"
				active={state.blockquote}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			>
				<IconBlockquote className="size-3.5" />
			</MenuButton>

			<span className="mx-0.5 h-4 w-px bg-border" />

			{state.link ? (
				<MenuButton
					label="Remove link"
					active
					onClick={() => editor.chain().focus().unsetLink().run()}
				>
					<IconUnlink className="size-3.5" />
				</MenuButton>
			) : (
				<MenuButton label="Add link" onClick={setLink}>
					<IconLink className="size-3.5" />
				</MenuButton>
			)}
		</BubbleMenu>
	);
}
