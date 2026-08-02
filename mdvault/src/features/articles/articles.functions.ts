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
	unpublishArticle,
	updateArticle,
} from "#/features/articles/articles.server";
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
