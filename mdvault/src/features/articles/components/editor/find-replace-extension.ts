import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface TextMatch {
	from: number;
	to: number;
}

interface FindReplaceState {
	query: string;
	active: number;
	decorations: DecorationSet;
}

interface FindReplaceMeta {
	query?: string;
	active?: number;
}

export const findReplacePluginKey = new PluginKey<FindReplaceState>(
	"findReplace",
);

export function findTextMatches(
	doc: ProseMirrorNode,
	query: string,
): TextMatch[] {
	if (!query) {
		return [];
	}

	const matches: TextMatch[] = [];
	const needle = query.toLocaleLowerCase();

	doc.descendants((node, pos) => {
		if (!node.isTextblock) {
			return;
		}

		let text = "";
		const positions: number[] = [];
		node.descendants((child, offset) => {
			if (child.isText && child.text) {
				text += child.text;
				for (let index = 0; index < child.text.length; index += 1) {
					positions.push(pos + 1 + offset + index);
				}
			} else if (child.isInline) {
				text += "\0";
				positions.push(pos + 1 + offset);
			}
			return false;
		});

		for (let index = 0; index <= text.length - query.length; index += 1) {
			if (
				text.slice(index, index + query.length).toLocaleLowerCase() !== needle
			) {
				continue;
			}
			const from = positions[index];
			const finalCharacter = positions[index + query.length - 1];
			if (from === undefined || finalCharacter === undefined) {
				break;
			}
			matches.push({
				from,
				to: finalCharacter + 1,
			});
			index += query.length - 1;
		}

		return false;
	});

	return matches;
}

function decorationsFor(
	doc: ProseMirrorNode,
	query: string,
	active: number,
): DecorationSet {
	const decorations = findTextMatches(doc, query).map((match, index) =>
		Decoration.inline(match.from, match.to, {
			class:
				index === active
					? "find-replace-match find-replace-match-active"
					: "find-replace-match",
		}),
	);
	return DecorationSet.create(doc, decorations);
}

export const FindReplaceExtension = Extension.create({
	name: "findReplace",

	addProseMirrorPlugins() {
		return [
			new Plugin<FindReplaceState>({
				key: findReplacePluginKey,
				state: {
					init: () => ({
						query: "",
						active: 0,
						decorations: DecorationSet.empty,
					}),
					apply: (transaction, previous, _oldState, newState) => {
						const meta = transaction.getMeta(
							findReplacePluginKey,
						) as FindReplaceMeta | null;
						const query = meta?.query ?? previous.query;
						const active = meta?.active ?? previous.active;
						if (!transaction.docChanged && !meta) {
							return previous;
						}
						return {
							query,
							active,
							decorations: decorationsFor(newState.doc, query, active),
						};
					},
				},
				props: {
					decorations: (state) =>
						findReplacePluginKey.getState(state)?.decorations ??
						DecorationSet.empty,
				},
			}),
		];
	},
});
