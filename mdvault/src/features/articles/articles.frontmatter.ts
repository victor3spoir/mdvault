import { ArticleFrontmatterSchema } from "#/features/articles/article.schema";
import type { ArticleFrontmatter } from "#/features/articles/articles.types";
import { InvalidContentError } from "#/features/shared/content-revision";
import { parseFrontmatter } from "#/lib/frontmatter";

export function parseArticleFrontmatter(content: string): {
	frontmatter: ArticleFrontmatter;
	body: string;
} {
	const { data, body } = parseFrontmatter(content);
	const parsed = ArticleFrontmatterSchema.safeParse(data);

	if (!parsed.success) {
		throw new InvalidContentError(
			"Article",
			parsed.error.issues.map((issue) => issue.message).join(", "),
		);
	}

	return { frontmatter: parsed.data, body };
}
