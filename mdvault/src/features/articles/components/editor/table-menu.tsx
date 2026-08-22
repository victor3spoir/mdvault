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
	IconTable,
	IconTableOff,
} from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface MenuButtonProps {
	label: string;
	active?: boolean;
	disabled?: boolean;
	destructive?: boolean;
	onClick: () => void;
	children: ReactNode;
}

function MenuButton({
	label,
	active,
	disabled,
	destructive,
	onClick,
	children,
}: MenuButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			title={label}
			disabled={disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			className={cn(
				"flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
				active && "bg-accent text-accent-foreground",
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
	const tableState = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			canAddRowBefore: current.can().addRowBefore(),
			canAddRowAfter: current.can().addRowAfter(),
			canDeleteRow: current.can().deleteRow(),
			canAddColumnBefore: current.can().addColumnBefore(),
			canAddColumnAfter: current.can().addColumnAfter(),
			canDeleteColumn: current.can().deleteColumn(),
			canToggleHeaderRow: current.can().toggleHeaderRow(),
			canToggleHeaderColumn: current.can().toggleHeaderColumn(),
			canToggleHeaderCell: current.can().toggleHeaderCell(),
			canMergeCells: current.can().mergeCells(),
			canSplitCell: current.can().splitCell(),
			canDeleteTable: current.can().deleteTable(),
			isHeaderCell: current.isActive("tableHeader"),
		}),
	});

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
			className="flex max-w-[calc(100vw-1rem)] items-center gap-0.5 overflow-x-auto rounded-lg border bg-popover p-1 shadow-lg"
		>
			<div className="flex shrink-0 items-center gap-0.5">
				<MenuButton
					label="Insert row above"
					disabled={!tableState.canAddRowBefore}
					onClick={() => editor.chain().focus().addRowBefore().run()}
				>
					<IconRowInsertTop className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Insert row below"
					disabled={!tableState.canAddRowAfter}
					onClick={() => editor.chain().focus().addRowAfter().run()}
				>
					<IconRowInsertBottom className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Delete row"
					disabled={!tableState.canDeleteRow}
					destructive
					onClick={() => editor.chain().focus().deleteRow().run()}
				>
					<IconRowRemove className="size-3.5" />
				</MenuButton>
			</div>

			<span className="mx-0.5 h-4 w-px shrink-0 bg-border" />

			<div className="flex shrink-0 items-center gap-0.5">
				<MenuButton
					label="Insert column left"
					disabled={!tableState.canAddColumnBefore}
					onClick={() => editor.chain().focus().addColumnBefore().run()}
				>
					<IconColumnInsertLeft className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Insert column right"
					disabled={!tableState.canAddColumnAfter}
					onClick={() => editor.chain().focus().addColumnAfter().run()}
				>
					<IconColumnInsertRight className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Delete column"
					disabled={!tableState.canDeleteColumn}
					destructive
					onClick={() => editor.chain().focus().deleteColumn().run()}
				>
					<IconColumnRemove className="size-3.5" />
				</MenuButton>
			</div>

			<span className="mx-0.5 h-4 w-px shrink-0 bg-border" />

			<div className="flex shrink-0 items-center gap-0.5">
				<MenuButton
					label="Toggle header row"
					disabled={!tableState.canToggleHeaderRow}
					onClick={() => editor.chain().focus().toggleHeaderRow().run()}
				>
					<IconLayoutNavbar className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Toggle header column"
					disabled={!tableState.canToggleHeaderColumn}
					onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
				>
					<IconLayoutSidebar className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Toggle header cell"
					active={tableState.isHeaderCell}
					disabled={!tableState.canToggleHeaderCell}
					onClick={() => editor.chain().focus().toggleHeaderCell().run()}
				>
					<IconTable className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Merge cells"
					disabled={!tableState.canMergeCells}
					onClick={() => editor.chain().focus().mergeCells().run()}
				>
					<IconArrowsJoin2 className="size-3.5" />
				</MenuButton>
				<MenuButton
					label="Split cell"
					disabled={!tableState.canSplitCell}
					onClick={() => editor.chain().focus().splitCell().run()}
				>
					<IconArrowsSplit2 className="size-3.5" />
				</MenuButton>
			</div>

			<span className="mx-0.5 h-4 w-px shrink-0 bg-border" />

			<MenuButton
				label="Delete table"
				disabled={!tableState.canDeleteTable}
				destructive
				onClick={() => editor.chain().focus().deleteTable().run()}
			>
				<IconTableOff className="size-3.5" />
			</MenuButton>
		</BubbleMenu>
	);
}
