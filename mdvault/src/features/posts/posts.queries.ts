import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";
import { prefetchMediaDataUrls } from "#/features/media/media.queries";
import {
	collectImageSources,
	extractMarkdownImageSources,
} from "#/features/media/media.utils";
import { getPostBySlug, getPosts } from "#/features/posts/posts.functions";
import type { Post } from "#/features/posts/posts.types";

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

export async function invalidatePostQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: postKeys.all }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
	]);
}

export function collectPostImageSources(post: Post) {
	return collectImageSources([
		post.coverImage,
		...extractMarkdownImageSources(post.content),
	]);
}

export async function prefetchPostsMedia(
	queryClient: QueryClient,
	posts: Post[],
) {
	await prefetchMediaDataUrls(
		queryClient,
		posts.flatMap((post) => collectPostImageSources(post)),
	);
}
