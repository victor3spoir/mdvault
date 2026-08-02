import {
	type ContentKind,
	createContentStore,
	InvalidContentError,
} from "#/features/content/content-store.server";
import {
	type CreatePostInput,
	CreatePostSchema,
	PostFrontmatterSchema,
	type UpdatePostInput,
	UpdatePostSchema,
} from "#/features/posts/post.schema";
import type { Post } from "#/features/posts/posts.types";
import type {
	ContentMutationResult,
	ContentRevision,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { parseFrontmatter } from "#/lib/frontmatter";

const postKind: ContentKind<Post, CreatePostInput> = {
	label: "Post",
	commitNoun: "post",
	root: () => getGitHubEnv().POSTS_PATH,

	toDocument({ id, data, body, path, sha }) {
		const parsed = PostFrontmatterSchema.safeParse(data);

		if (!parsed.success) {
			throw new InvalidContentError(
				"Post",
				parsed.error.issues.map((issue) => issue.message).join(", "),
			);
		}

		const frontmatter = parsed.data;
		const now = new Date().toISOString();

		return {
			id,
			title: frontmatter.title,
			content: body,
			lang: frontmatter.lang,
			createdAt: frontmatter.createdAt || now,
			updatedAt: frontmatter.updatedAt || now,
			publishedAt: frontmatter.publishedDate,
			published: frontmatter.published,
			author: frontmatter.author,
			article: frontmatter.article,
			coverImage: frontmatter.coverImage,
			path,
			sha,
		};
	},

	toFrontmatter(post) {
		return {
			title: post.title,
			published: post.published,
			lang: post.lang,
			author: post.author,
			article: post.article,
			coverImage: post.coverImage,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			publishedDate: post.publishedAt,
		};
	},

	toNewDocument({ id, input, body, now, author }) {
		return {
			id,
			title: input.title,
			content: body,
			lang: input.lang,
			createdAt: now,
			updatedAt: now,
			publishedAt: input.published ? now : undefined,
			published: input.published,
			author: input.author || author,
			article: input.article,
			coverImage: input.coverImage,
			path: "",
			sha: "",
		};
	},
};

const posts = createContentStore(postKind);

/** Exposed for tests: parses a stored post document into its metadata. */
export function parseFrontmatterToPost(content: string) {
	const { data, body } = parseFrontmatter(content);

	return postKind.toDocument({
		id: "preview",
		data,
		body,
		path: "",
		sha: "",
	});
}

export async function listPosts(): Promise<ActionResult<Post[]>> {
	return posts.list();
}

export async function getPost(
	id: string,
	path?: string,
): Promise<ActionResult<Post>> {
	return posts.get(id, path);
}

export async function createPost(
	input: CreatePostInput,
): Promise<ActionResult<string>> {
	return posts.create(CreatePostSchema.parse(input));
}

export async function updatePost(
	id: string,
	input: UpdatePostInput,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return posts.update(id, UpdatePostSchema.parse(input), revision);
}

export async function deletePost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<boolean>> {
	return posts.remove(id, revision);
}

export async function publishPost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return posts.setPublished(id, true, revision);
}

export async function unpublishPost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return posts.setPublished(id, false, revision);
}
