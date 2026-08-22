import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export function currentTopLevelBlockPosition(editor: Editor) {
	const { $from } = editor.state.selection;
	return $from.depth > 0 ? $from.before(1) : -1;
}

export function moveTopLevelBlock(
	editor: Editor,
	position: number,
	direction: -1 | 1,
) {
	const { doc } = editor.state;
	const node = doc.nodeAt(position);
	if (!node) {
		return false;
	}

	const adjacentPosition =
		direction === -1 ? position - 1 : position + node.nodeSize;
	const adjacent =
		direction === -1
			? doc.resolve(position).nodeBefore
			: doc.nodeAt(adjacentPosition);
	if (!adjacent) {
		return false;
	}

	const insertPosition =
		direction === -1
			? position - adjacent.nodeSize
			: position + adjacent.nodeSize;
	const selectionFromOffset = editor.state.selection.from - position;
	const selectionToOffset = editor.state.selection.to - position;
	const transaction = editor.state.tr
		.delete(position, position + node.nodeSize)
		.insert(insertPosition, node);
	transaction
		.setSelection(
			TextSelection.create(
				transaction.doc,
				insertPosition + selectionFromOffset,
				insertPosition + selectionToOffset,
			),
		)
		.scrollIntoView();
	editor.view.dispatch(transaction);
	return true;
}
