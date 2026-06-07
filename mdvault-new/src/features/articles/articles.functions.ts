import { createServerFn } from "@tanstack/react-start";
import type {
	CreateArticleInput,
	UpdateArticleInput,
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

export const getArticles = createServerFn({ method: "GET" }).handler(
	async () => {
		const result = await listArticles();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	},
);

export const getArticleById = createServerFn({ method: "GET" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const result = await getArticle(data.id);
		return result.success ? result.data : null;
	});

export const createArticleMutation = createServerFn({ method: "POST" })
	.validator((data: CreateArticleInput) => data)
	.handler(async ({ data }) => {
		const result = await createArticle(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateArticleMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string; input: UpdateArticleInput }) => data)
	.handler(async ({ data }) => {
		const result = await updateArticle(data.id, data.input);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deleteArticleMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string; sha: string }) => data)
	.handler(async ({ data }) => {
		const result = await deleteArticle(data.id, data.sha);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const publishArticleMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const result = await publishArticle(data.id);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const unpublishArticleMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const result = await unpublishArticle(data.id);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
