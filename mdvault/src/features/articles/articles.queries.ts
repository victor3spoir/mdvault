import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	getArticleById,
	getArticles,
} from "#/features/articles/articles.functions";
import type { Article } from "#/features/articles/articles.types";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";
import { prefetchMediaDataUrls } from "#/features/media/media.queries";
import {
	collectImageSources,
	extractMarkdownImageSources,
} from "#/features/media/media.utils";

export const articleKeys = {
	all: ["articles"] as const,
	list: () => [...articleKeys.all, "list"] as const,
	details: () => [...articleKeys.all, "detail"] as const,
	detail: (id: string) => [...articleKeys.details(), id] as const,
};

export const articlesListQueryOptions = () =>
	queryOptions({
		queryKey: articleKeys.list(),
		queryFn: () => getArticles(),
		staleTime: 30_000,
	});

export const articleQueryOptions = (id: string) =>
	queryOptions({
		queryKey: articleKeys.detail(id),
		queryFn: () => getArticleById({ data: { id } }),
		staleTime: 30_000,
	});

export async function invalidateArticleQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: articleKeys.all }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
	]);
}

export function collectArticleImageSources(article: Article) {
	return collectImageSources([
		article.coverImage,
		...extractMarkdownImageSources(article.content),
	]);
}

export async function prefetchArticlesMedia(
	queryClient: QueryClient,
	articles: Article[],
) {
	await prefetchMediaDataUrls(
		queryClient,
		articles.flatMap((article) => collectArticleImageSources(article)),
	);
}
