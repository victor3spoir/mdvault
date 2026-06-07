import { createServerFn } from "@tanstack/react-start";
import type {
	CreatePostInput,
	UpdatePostInput,
} from "#/features/posts/post.schema";
import {
	createPost,
	deletePost,
	getPost,
	listPosts,
	publishPost,
	unpublishPost,
	updatePost,
} from "#/features/posts/posts.server";

export const getPosts = createServerFn({ method: "GET" }).handler(async () => {
	const result = await listPosts();

	if (!result.success) {
		throw new Error(result.error);
	}

	return result.data;
});

export const getPostBySlug = createServerFn({ method: "GET" })
	.validator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const result = await getPost(data.slug);
		return result.success ? result.data : null;
	});

export const createPostMutation = createServerFn({ method: "POST" })
	.validator((data: CreatePostInput) => data)
	.handler(async ({ data }) => {
		const result = await createPost(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updatePostMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string; input: UpdatePostInput }) => data)
	.handler(async ({ data }) => {
		const result = await updatePost(data.id, data.input);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deletePostMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string; sha: string }) => data)
	.handler(async ({ data }) => {
		const result = await deletePost(data.id, data.sha);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const publishPostMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const result = await publishPost(data.id);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const unpublishPostMutation = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const result = await unpublishPost(data.id);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
