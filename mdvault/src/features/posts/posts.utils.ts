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
