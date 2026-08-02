import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	CreatePostSchema,
	UpdatePostSchema,
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
import { ContentRevisionSchema } from "#/features/shared/content-revision";
import { securityMiddleware } from "#/lib/security-middleware";

export const getPosts = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.handler(async () => {
		const result = await listPosts();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getPostBySlug = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) => z.object({ slug: z.string().min(1) }).parse(data))
	.handler(async ({ data }) => {
		const result = await getPost(data.slug);
		if (result.success) {
			return result.data;
		}
		if (result.error === "Post not found") {
			return null;
		}
		throw new Error(result.error);
	});

export const createPostMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => CreatePostSchema.parse(data))
	.handler(async ({ data }) => {
		const result = await createPost(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updatePostMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				id: z.string().min(1),
				input: UpdatePostSchema,
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await updatePost(data.id, data.input, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deletePostMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await deletePost(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const publishPostMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await publishPost(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const unpublishPostMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({ id: z.string().min(1), revision: ContentRevisionSchema })
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await unpublishPost(data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
