import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	getArticleById,
	getArticles,
} from "#/features/articles/articles.functions";
import type { Article } from "#/features/articles/articles.types";
import { prefetchMediaDataUrls } from "#/features/media/media.queries";
import {
	collectImageSources,
	extractMarkdownImageSources,
} from "#/features/media/media.utils";

export const articlesListQueryOptions = () =>
	queryOptions({
		queryKey: ["articles", "list"],
		queryFn: () => getArticles(),
		staleTime: 30_000,
	});

export const articleQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["articles", "detail", id],
		queryFn: () => getArticleById({ data: { id } }),
		staleTime: 30_000,
	});

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
