import type { BlockNode, InlineNode } from "@tanstack/markdown";

/**
 * Flattens a block tree to plain text for the search index.
 *
 * Code fences are dropped but inline code is kept: readers search for
 * `DATABASE_URL`, not for the body of a forty-line example.
 */
export function blocksToText(nodes: Array<BlockNode>): string {
	return nodes
		.map(blockToText)
		.filter(Boolean)
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

function blockToText(node: BlockNode): string {
	switch (node.type) {
		case "heading":
		case "paragraph":
			return inlinesToText(node.children);
		case "code":
			return "";
		case "list":
			return node.items.map((item) => blocksToText(item.children)).join(" ");
		case "blockquote":
		case "callout":
		case "component":
			return blocksToText(node.children);
		case "table":
			return [
				...node.header.map((cell) => inlinesToText(cell.children)),
				...node.rows.flatMap((row) =>
					row.map((cell) => inlinesToText(cell.children)),
				),
			].join(" ");
		case "footnotes":
			return node.items.map((item) => blocksToText(item.children)).join(" ");
		default:
			return "";
	}
}

function inlinesToText(nodes: Array<InlineNode>): string {
	return nodes
		.map((node) => {
			switch (node.type) {
				case "text":
				case "inlineCode":
					return node.value;
				case "strong":
				case "emphasis":
				case "strike":
				case "link":
					return inlinesToText(node.children);
				case "image":
					return node.alt;
				case "break":
					return " ";
				default:
					return "";
			}
		})
		.join("");
}

/** Splits a document into `{ heading, body }` slices, one per heading. */
export function splitByHeadings(nodes: Array<BlockNode>): Array<{
	heading: string;
	headingId: string;
	body: Array<BlockNode>;
}> {
	const slices: Array<{
		heading: string;
		headingId: string;
		body: Array<BlockNode>;
	}> = [{ heading: "", headingId: "", body: [] }];

	for (const node of nodes) {
		if (node.type === "heading" && node.depth <= 3) {
			slices.push({
				heading: inlinesToText(node.children),
				headingId: node.id ?? "",
				body: [],
			});
			continue;
		}

		slices[slices.length - 1]?.body.push(node);
	}

	return slices.filter((slice) => slice.heading || slice.body.length);
}
