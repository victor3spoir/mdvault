import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { highlighter } from "#/lib/highlight";

const highlightPluginKey = new PluginKey("codeBlockHighlight");

function buildDecorations(doc: ProseMirrorNode, nodeName: string) {
	const decorations: Decoration[] = [];

	doc.descendants((node, pos) => {
		if (node.type.name !== nodeName) {
			return;
		}

		const language =
			typeof node.attrs.language === "string" && node.attrs.language
				? node.attrs.language
				: "plaintext";

		const code = node.textContent;
		if (!code) {
			return;
		}

		const { tokens } = highlighter.highlight(code, { lang: language });
		let offset = pos + 1;

		for (const token of tokens) {
			const length = token.value.length;
			if (token.className) {
				decorations.push(
					Decoration.inline(offset, offset + length, {
						class: `th-token th-${token.className}`,
					}),
				);
			}
			offset += length;
		}
	});

	return DecorationSet.create(doc, decorations);
}

/**
 * ProseMirror plugin decorating code blocks with TanStack Highlight tokens.
 * The token stream reproduces the source exactly, so class ranges are mapped
 * by accumulating token lengths. Uses the same highlighter and --th-* theme
 * variables as the article preview, keeping editor and preview identical.
 */
export function createCodeBlockHighlightPlugin(nodeName: string) {
	return new Plugin({
		key: highlightPluginKey,
		state: {
			init: (_, { doc }) => buildDecorations(doc, nodeName),
			apply: (transaction, decorationSet, _oldState, newState) => {
				if (!transaction.docChanged) {
					return decorationSet.map(transaction.mapping, transaction.doc);
				}

				return buildDecorations(newState.doc, nodeName);
			},
		},
		props: {
			decorations(state) {
				return this.getState(state);
			},
		},
	});
}
