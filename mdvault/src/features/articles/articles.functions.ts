import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	CreateArticleSchema,
	UpdateArticleSchema,
} from "#/features/articles/article.schema";
import {
	createArticle,
	deleteArticle,
	getArticle,
	listArticles,
	publishArticle,
	setArticleTranslationKey,
	unpublishArticle,
	updateArticle,
} from "#/features/articles/articles.server";
import type { Article } from "#/features/articles/articles.types";
import {
	createTranslationKey,
	findLinkCandidates,
	findTranslations,
	getTranslationLinkError,
} from "#/features/shared/article-translations";
import { ContentRevisionSchema } from "#/features/shared/content-revision";
import { securityMiddleware } from "#/lib/security-middleware";

export const getArticles = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.handler(async () => {
		const result = await listArticles();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getArticleById = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) => z.object({ id: z.string().min(1) }).parse(data))
	.handler(async ({ data }) => {
		const result = await getArticle(data.id);
		if (result.success) {
			return result.data;
		}
		if (result.error === "Article not found") {
			return null;
		}
		throw new Error(result.error);
	});

/**
 * Translation siblings and link candidates for one article. Computed on the
 * server so the editor receives summaries instead of every article body.
 */
export const getArticleTranslations = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) => z.object({ id: z.string().min(1) }).parse(data))
	.handler(async ({ data }) => {
		const result = await listArticles();

		if (!result.success) {
			throw new Error(result.error);
		}

		const articles = result.data;
		const article = articles.find((candidate) => candidate.id === data.id);

		if (!article) {
			return { translations: [], candidates: [] };
		}

		return {
			translations: findTranslations(articles, article).map(toSummary),
			candidates: findLinkCandidates(articles, article).map(toSummary),
		};
	});

function toSummary(article: Article) {
	return {
		id: article.id,
		title: article.title,
		lang: article.lang,
		published: article.published,
		translationKey: article.translationKey,
	};
}

/**
 * Puts two articles in the same translation group. Both sides are written
 * server-side so a group is never half-formed by an unsaved editor buffer.
 */
export const linkArticleTranslationMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), targetId: z.string().min(1) })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const listed = await listArticles();

		if (!listed.success) {
			throw new Error(listed.error);
		}

		const source = listed.data.find((item) => item.id === data.id);
		const target = listed.data.find((item) => item.id === data.targetId);

		if (!source || !target) {
			throw new Error("Article not found");
		}

		const linkError = getTranslationLinkError(listed.data, source, target);
		if (linkError) {
			throw new Error(linkError);
		}

		const translationKey =
			source.translationKey ??
			target.translationKey ??
			createTranslationKey(source.title);

		if (target.translationKey !== translationKey) {
			const written = await setArticleTranslationKey(
				target.id,
				translationKey,
				{
					path: target.path,
					sha: target.sha,
				},
			);

			if (!written.success) {
				throw new Error(written.error);
			}
		}

		if (source.translationKey !== translationKey) {
			const written = await setArticleTranslationKey(
				source.id,
				translationKey,
				{
					path: source.path,
					sha: source.sha,
				},
			);

			if (!written.success) {
				throw new Error(written.error);
			}

			return { translationKey, revision: written.data };
		}

		return {
			translationKey,
			revision: { id: source.id, path: source.path, sha: source.sha },
		};
	});

/** Removes one article from its group; the remaining members keep the key. */
export const unlinkArticleTranslationMutation = createServerFn({
	method: "POST",
})
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await setArticleTranslationKey(
			data.id,
			undefined,
			data.revision,
		);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const createArticleMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => CreateArticleSchema.parse(data))
	.handler(async ({ data }) => {
		const result = await createArticle(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateArticleMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				id: z.string().min(1),
				input: UpdateArticleSchema,
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await updateArticle(data.id, data.input, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deleteArticleMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await deleteArticle(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const publishArticleMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await publishArticle(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const unpublishArticleMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await unpublishArticle(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
