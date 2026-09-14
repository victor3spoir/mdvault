import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import DragHandle, {
	type DragHandleProps,
} from "@tiptap/extension-drag-handle-react";
import type { Editor } from "@tiptap/react";
import { useCallback, useRef } from "react";
import { Button } from "#/components/ui/button";
import { deleteTopLevelBlock } from "#/features/articles/components/editor/block-reorder";

const POSITION = { placement: "left-start" } as const;

export function BlockDragControls({ editor }: { editor: Editor }) {
	const hovered = useRef<
		Parameters<NonNullable<DragHandleProps["onNodeChange"]>>[0] | null
	>(null);
	const onNodeChange = useCallback<
		NonNullable<DragHandleProps["onNodeChange"]>
	>((target) => {
		hovered.current = target;
	}, []);

	return (
		<DragHandle
			editor={editor}
			className="editor-drag-handle"
			computePositionConfig={POSITION}
			onNodeChange={onNodeChange}
		>
			<div className="flex flex-col gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
				<button
					type="button"
					tabIndex={-1}
					aria-hidden="true"
					title="Drag block"
					className="flex size-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
				>
					<IconGripVertical className="size-4" />
				</button>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-label="Delete block"
					title="Delete block (Undo to restore)"
					onMouseDown={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					onDragStart={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					onClick={(event) => {
						event.stopPropagation();
						const target = hovered.current;
						if (
							!target?.node ||
							target.pos < 0 ||
							target.pos >= editor.state.doc.content.size ||
							editor.state.doc.nodeAt(target.pos) !== target.node
						)
							return;
						if (deleteTopLevelBlock(editor, target.pos)) {
							hovered.current = null;
							editor.commands.focus();
						}
					}}
				>
					<IconTrash />
				</Button>
			</div>
		</DragHandle>
	);
}
