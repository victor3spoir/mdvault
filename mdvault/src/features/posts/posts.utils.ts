import type { Post } from "#/features/posts/posts.types";

export type PostListFilters = {
	searchQuery: string;
	status: "all" | "published" | "draft";
	lang: "all" | "fr" | "en";
	sortBy: "date" | "title";
	sortOrder: "asc" | "desc";
};

export function filterAndSortPosts(
	posts: readonly Post[],
	filters: PostListFilters,
): Post[] {
	const query = filters.searchQuery.trim().toLowerCase();
	const modifier = filters.sortOrder === "asc" ? 1 : -1;

	return posts
		.filter((post) => {
			const matchesSearch =
				!query ||
				post.title.toLowerCase().includes(query) ||
				post.content.toLowerCase().includes(query) ||
				post.author?.toLowerCase().includes(query);
			const matchesStatus =
				filters.status === "all" ||
				(filters.status === "published" ? post.published : !post.published);
			const matchesLang = filters.lang === "all" || post.lang === filters.lang;

			return matchesSearch && matchesStatus && matchesLang;
		})
		.sort((a, b) => {
			if (filters.sortBy === "title") {
				return a.title.localeCompare(b.title) * modifier;
			}

			return (
				(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
				modifier
			);
		});
}

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
