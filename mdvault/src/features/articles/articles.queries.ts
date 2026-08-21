import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	getArticleById,
	getArticles,
	getArticleTranslations,
} from "#/features/articles/articles.functions";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";

export const articleKeys = {
	all: ["articles"] as const,
	list: () => [...articleKeys.all, "list"] as const,
	details: () => [...articleKeys.all, "detail"] as const,
	detail: (id: string) => [...articleKeys.details(), id] as const,
	translations: (id: string) =>
		[...articleKeys.detail(id), "translations"] as const,
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

export const articleTranslationsQueryOptions = (id: string) =>
	queryOptions({
		queryKey: articleKeys.translations(id),
		queryFn: () => getArticleTranslations({ data: { id } }),
		staleTime: 30_000,
	});

/** `refetchType: "all"` required: see `invalidatePostQueries`. */
export async function invalidateArticleQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: articleKeys.all,
			refetchType: "all",
		}),
		queryClient.invalidateQueries({
			queryKey: dashboardKeys.all,
			refetchType: "all",
		}),
	]);
}
