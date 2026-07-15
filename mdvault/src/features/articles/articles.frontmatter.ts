import matter from "gray-matter";
import { ArticleFrontmatterSchema } from "#/features/articles/article.schema";
import type { ArticleFrontmatter } from "#/features/articles/articles.types";
import { InvalidContentError } from "#/features/shared/content-revision";

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
	const parsed = ArticleFrontmatterSchema.safeParse(data);

	if (!parsed.success) {
		throw new InvalidContentError(
			"Article",
			parsed.error.issues.map((issue) => issue.message).join(", "),
		);
	}

	return { frontmatter: parsed.data, body };
}
