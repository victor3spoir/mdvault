import {
	IconArrowsJoin2,
	IconArrowsSplit2,
	IconColumnInsertLeft,
	IconColumnInsertRight,
	IconColumnRemove,
	IconLayoutNavbar,
	IconLayoutSidebar,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconRowRemove,
	IconTableOff,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface MenuButtonProps {
	label: string;
	disabled?: boolean;
	destructive?: boolean;
	onClick: () => void;
	children: ReactNode;
}

function MenuButton({
	label,
	disabled,
	destructive,
	onClick,
	children,
}: MenuButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			disabled={disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			className={cn(
				"flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
				destructive && "hover:bg-destructive/10 hover:text-destructive",
			)}
		>
			{children}
		</button>
	);
}

function isCellSelection(selection: unknown) {
	return typeof selection === "object" && selection !== null
		? "$anchorCell" in selection
		: false;
}

interface TableMenuProps {
	editor: Editor;
}

/**
 * Floating table controls shown when the caret sits inside a table (or when
 * whole cells are selected). Text selections inside a cell keep showing the
 * formatting menu instead, so the two never overlap.
 */
export function TableMenu({ editor }: TableMenuProps) {
	return (
		<BubbleMenu
			editor={editor}
			pluginKey="tableMenu"
			shouldShow={({ editor: current, state, from, to }) => {
				if (!current.isActive("table")) {
					return false;
				}
				return from === to || isCellSelection(state.selection);
			}}
			className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg"
		>
			<MenuButton
				label="Insert row above"
				onClick={() => editor.chain().focus().addRowBefore().run()}
			>
				<IconRowInsertTop className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Insert row below"
				onClick={() => editor.chain().focus().addRowAfter().run()}
			>
				<IconRowInsertBottom className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Delete row"
				destructive
				onClick={() => editor.chain().focus().deleteRow().run()}
			>
				<IconRowRemove className="size-3.5" />
			</MenuButton>

			<span className="mx-0.5 h-4 w-px bg-border" />

			<MenuButton
				label="Insert column left"
				onClick={() => editor.chain().focus().addColumnBefore().run()}
			>
				<IconColumnInsertLeft className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Insert column right"
				onClick={() => editor.chain().focus().addColumnAfter().run()}
			>
				<IconColumnInsertRight className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Delete column"
				destructive
				onClick={() => editor.chain().focus().deleteColumn().run()}
			>
				<IconColumnRemove className="size-3.5" />
			</MenuButton>

			<span className="mx-0.5 h-4 w-px bg-border" />

			<MenuButton
				label="Toggle header row"
				onClick={() => editor.chain().focus().toggleHeaderRow().run()}
			>
				<IconLayoutNavbar className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Toggle header column"
				onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
			>
				<IconLayoutSidebar className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Merge cells"
				disabled={!editor.can().mergeCells()}
				onClick={() => editor.chain().focus().mergeCells().run()}
			>
				<IconArrowsJoin2 className="size-3.5" />
			</MenuButton>
			<MenuButton
				label="Split cell"
				disabled={!editor.can().splitCell()}
				onClick={() => editor.chain().focus().splitCell().run()}
			>
				<IconArrowsSplit2 className="size-3.5" />
			</MenuButton>

			<span className="mx-0.5 h-4 w-px bg-border" />

			<MenuButton
				label="Delete table"
				destructive
				onClick={() => editor.chain().focus().deleteTable().run()}
			>
				<IconTableOff className="size-3.5" />
			</MenuButton>
		</BubbleMenu>
	);
}
