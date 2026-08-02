/**
 * Plain-text excerpt for cards: strips markdown syntax and truncates at a
 * word boundary with an ellipsis.
 */
export function getPostExcerpt(content: string, maxLength = 140) {
	const plain = content
		// code blocks & inline code
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		// images & links -> keep link text
		.replace(/!\[[^\]]*]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
		// headings, quotes, list markers, emphasis
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/^>\s?/gm, "")
		.replace(/^[-*+]\s+/gm, "")
		.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
		// collapse whitespace
		.replace(/\s+/g, " ")
		.trim();

	if (plain.length <= maxLength) {
		return plain;
	}

	const cut = plain.slice(0, maxLength);
	const lastSpace = cut.lastIndexOf(" ");
	return `${cut.slice(0, lastSpace > 60 ? lastSpace : maxLength).trimEnd()}...`;
}
