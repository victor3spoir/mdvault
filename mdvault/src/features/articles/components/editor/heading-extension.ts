import { mergeAttributes } from "@tiptap/core";
import Heading, { type Level } from "@tiptap/extension-heading";

const readableLevels: Level[] = [1, 2, 3, 4, 5, 6];

// Restrict authoring tools without changing headings in existing documents.
export const HeadingExtension = Heading.extend({
	parseHTML() {
		return readableLevels.map((level) => ({
			tag: `h${level}`,
			attrs: { level },
		}));
	},
	renderHTML({ node, HTMLAttributes }) {
		const level = readableLevels.includes(node.attrs.level)
			? node.attrs.level
			: this.options.levels[0];
		return [
			`h${level}`,
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		];
	},
}).configure({ levels: [2, 3, 4] });
