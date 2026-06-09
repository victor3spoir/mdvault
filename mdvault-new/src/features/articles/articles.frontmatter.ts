import matter from "gray-matter";
import type { ArticleFrontmatter } from "#/features/articles/articles.types";

export function generateFrontmatter(data: ArticleFrontmatter): string {
	const cleanData = Object.fromEntries(
		Object.entries(data).filter(([, value]) => {
			if (value === undefined || value === null) {
				return false;
			}

			if (Array.isArray(value) && value.length === 0) {
				return false;
			}

			return true;
		}),
	);

	return matter.stringify("", cleanData).trim();
}

export function parseArticleFrontmatter(content: string): {
	frontmatter: ArticleFrontmatter;
	body: string;
} {
	const { data, content: body } = matter(content);

	return {
		frontmatter: {
			title: data.title ?? "Untitled",
			description: data.description,
			published: data.published ?? false,
			lang: (data.lang ?? "en") as "fr" | "en",
			author: data.author,
			coverImage:
				typeof data.coverImage === "string"
					? data.coverImage.trim()
					: data.coverImage,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			publishedDate: data.publishedDate,
			tags: Array.isArray(data.tags) ? data.tags : undefined,
		},
		body,
	};
}
