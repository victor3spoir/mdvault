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
 * Invalidates every post query after a mutation.
 *
 * `refetchType: "all"` matters here: the lists are rendered from route loader
 * data, not from a `useQuery` hook, so the queries have no active observer.
 * With the default (`"active"`) they would be marked stale but never refetched,
 * and `ensureQueryData` in the loader would happily hand back the stale cache -
 * the status of a post would only change after a full page reload.
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
