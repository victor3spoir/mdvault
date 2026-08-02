import {
	ArticleFrontmatterSchema,
	type CreateArticleInput,
	CreateArticleSchema,
	type UpdateArticleInput,
	UpdateArticleSchema,
} from "#/features/articles/article.schema";
import type { Article } from "#/features/articles/articles.types";
import {
	type ContentKind,
	createContentStore,
	InvalidContentError,
} from "#/features/content/content-store.server";
import type {
	ContentMutationResult,
	ContentRevision,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubEnv } from "#/integrations/github/github-env.server";

const articleKind: ContentKind<Article, CreateArticleInput> = {
	label: "Article",
	commitNoun: "article",
	root: () => getGitHubEnv().ARTICLES_PATH,

	toDocument({ id, data, body, path, sha }) {
		const parsed = ArticleFrontmatterSchema.safeParse(data);

		if (!parsed.success) {
			throw new InvalidContentError(
				"Article",
				parsed.error.issues.map((issue) => issue.message).join(", "),
			);
		}

		const frontmatter = parsed.data;
		const now = new Date().toISOString();

		return {
			id,
			title: frontmatter.title,
			description: frontmatter.description,
			content: body,
			lang: frontmatter.lang,
			createdAt: frontmatter.createdAt || now,
			updatedAt: frontmatter.updatedAt || now,
			publishedAt: frontmatter.publishedDate,
			published: frontmatter.published,
			author: frontmatter.author,
			tags: frontmatter.tags,
			coverImage: frontmatter.coverImage,
			path,
			sha,
		};
	},

	toFrontmatter(article) {
		return {
			title: article.title,
			description: article.description,
			published: article.published,
			lang: article.lang,
			tags: article.tags,
			coverImage: article.coverImage,
			author: article.author,
			createdAt: article.createdAt,
			updatedAt: article.updatedAt,
			publishedDate: article.publishedAt,
		};
	},

	toNewDocument({ id, input, body, now, author }) {
		return {
			id,
			title: input.title,
			description: input.description,
			content: body,
			lang: input.lang,
			createdAt: now,
			updatedAt: now,
			publishedAt: input.published ? now : undefined,
			published: input.published,
			author: input.author || author,
			tags: input.tags,
			coverImage: input.coverImage,
			path: "",
			sha: "",
		};
	},
};

const articles = createContentStore(articleKind);

export async function listArticles(): Promise<ActionResult<Article[]>> {
	return articles.list();
}

export async function getArticle(
	id: string,
	path?: string,
): Promise<ActionResult<Article>> {
	return articles.get(id, path);
}

export async function createArticle(
	input: CreateArticleInput,
): Promise<ActionResult<string>> {
	return articles.create(CreateArticleSchema.parse(input));
}

export async function updateArticle(
	id: string,
	input: UpdateArticleInput,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return articles.update(id, UpdateArticleSchema.parse(input), revision);
}

export async function deleteArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<boolean>> {
	return articles.remove(id, revision);
}

export async function publishArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return articles.setPublished(id, true, revision);
}

export async function unpublishArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return articles.setPublished(id, false, revision);
}

export async function getArticleStats() {
	const result = await listArticles();
	const list = result.success ? result.data : [];

	return {
		totalArticles: list.length,
		publishedArticles: list.filter((article) => article.published).length,
		draftArticles: list.filter((article) => !article.published).length,
	};
}
