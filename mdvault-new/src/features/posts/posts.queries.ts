import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { prefetchMediaDataUrls } from "#/features/media/media.queries";
import {
	collectImageSources,
	extractMarkdownImageSources,
} from "#/features/media/media.utils";
import { getPostBySlug, getPosts } from "#/features/posts/posts.functions";
import type { Post } from "#/features/posts/posts.types";

export const postsListQueryOptions = () =>
	queryOptions({
		queryKey: ["posts", "list"],
		queryFn: () => getPosts(),
		staleTime: 30_000,
	});

export const postQueryOptions = (slug: string) =>
	queryOptions({
		queryKey: ["posts", "detail", slug],
		queryFn: () => getPostBySlug({ data: { slug } }),
		staleTime: 30_000,
	});

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
