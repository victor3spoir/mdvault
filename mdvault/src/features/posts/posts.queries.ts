import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";
import { getPostBySlug, getPosts } from "#/features/posts/posts.functions";

export const postKeys = {
	all: ["posts"] as const,
	list: () => [...postKeys.all, "list"] as const,
	details: () => [...postKeys.all, "detail"] as const,
	detail: (slug: string) => [...postKeys.details(), slug] as const,
};

export const postsListQueryOptions = () =>
	queryOptions({
		queryKey: postKeys.list(),
		queryFn: () => getPosts(),
		staleTime: 30_000,
	});

export const postQueryOptions = (slug: string) =>
	queryOptions({
		queryKey: postKeys.detail(slug),
		queryFn: () => getPostBySlug({ data: { slug } }),
		staleTime: 30_000,
	});

/**
 * `refetchType: "all"` is required: lists render from loader data, so the
 * queries have no active observer and would be marked stale without refetching.
 */
export async function invalidatePostQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: postKeys.all,
			refetchType: "all",
		}),
		queryClient.invalidateQueries({
			queryKey: dashboardKeys.all,
			refetchType: "all",
		}),
	]);
}
