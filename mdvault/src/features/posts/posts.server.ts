import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import {
	type CreatePostInput,
	CreatePostSchema,
	PostFrontmatterSchema,
	type UpdatePostInput,
	UpdatePostSchema,
} from "#/features/posts/post.schema";
import type {
	GitHubFile,
	Post,
	PostFrontmatter,
} from "#/features/posts/posts.types";
import {
	assertContentRevision,
	type ContentMutationResult,
	ContentNotFoundError,
	type ContentRevision,
	getContentPathCandidates,
	InvalidContentError,
	resolveContentPath,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { getRepositoryFilePath } from "#/lib/repository-path";
import { sanitizeMarkdown } from "#/lib/sanitize";
import {
	createContentErrorMessage,
	isGitHubNotFoundError,
} from "#/lib/server/content-errors.server";
import { logger } from "#/lib/server/logger";

function base64ToUtf8(base64: string) {
	const binary = atob(base64);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

function utf8ToBase64(text: string) {
	const bytes = new TextEncoder().encode(text);
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

function createPostObject(
	id: string,
	frontmatter: PostFrontmatter,
	path: string,
	sha: string,
): Post {
	return {
		id,
		title: frontmatter.title,
		content: frontmatter.content,
		lang: frontmatter.lang,
		createdAt: frontmatter.createdAt || new Date().toISOString(),
		updatedAt: frontmatter.updatedAt || new Date().toISOString(),
		publishedAt: frontmatter.publishedDate,
		published: frontmatter.published,
		author: frontmatter.author,
		article: frontmatter.article,
		coverImage: frontmatter.coverImage,
		path,
		sha,
	};
}

export function parseFrontmatterToPost(content: string): PostFrontmatter {
	const { data, content: body } = matter(content);
	const parsed = PostFrontmatterSchema.safeParse(data);

	if (!parsed.success) {
		throw new InvalidContentError(
			"Post",
			parsed.error.issues.map((issue) => issue.message).join(", "),
		);
	}

	return { ...parsed.data, content: body.trim() };
}

function generateFrontmatterText(data: PostFrontmatter) {
	const frontmatterObj: Record<string, unknown> = {
		title: data.title,
		published: data.published,
		lang: data.lang,
	};

	if (data.author) frontmatterObj.author = data.author;
	if (data.article) frontmatterObj.article = data.article;
	if (data.coverImage) frontmatterObj.coverImage = data.coverImage;
	if (data.createdAt) frontmatterObj.createdAt = data.createdAt;
	if (data.updatedAt) frontmatterObj.updatedAt = data.updatedAt;
	if (data.publishedDate) frontmatterObj.publishedDate = data.publishedDate;

	return matter.stringify(data.content, frontmatterObj);
}

async function readPostFile(path: string) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const response = await octokit.repos.getContent({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
	});

	if (Array.isArray(response.data) || response.data.type !== "file") {
		throw new ContentNotFoundError("Post");
	}

	return {
		path,
		sha: response.data.sha,
		content: base64ToUtf8(response.data.content),
	};
}

async function findPostFile(id: string, requestedPath?: string) {
	const env = getGitHubEnv();
	const paths = requestedPath
		? [resolveContentPath(env.POSTS_PATH, id, requestedPath)].filter(
				(path): path is string => path !== null,
			)
		: getContentPathCandidates(env.POSTS_PATH, id);

	if (paths.length === 0) {
		throw new ContentNotFoundError("Post");
	}

	for (const path of paths) {
		try {
			return await readPostFile(path);
		} catch (error) {
			if (!isGitHubNotFoundError(error)) {
				throw error;
			}
		}
	}

	throw new ContentNotFoundError("Post");
}

async function updateGitHubFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const response = await octokit.repos.createOrUpdateFileContents({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
		message,
		content: utf8ToBase64(content),
		sha,
	});
	const nextSha = response.data.content?.sha;

	if (!nextSha) {
		throw new Error("GitHub did not return the updated post revision");
	}

	return nextSha;
}

function getCurrentUser() {
	return getGitHubEnv().GITHUB_OWNER;
}

export async function listPosts(): Promise<ActionResult<Post[]>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: env.POSTS_PATH,
		});

		if (!Array.isArray(response.data)) {
			return { success: true, data: [] };
		}

		const files = response.data as GitHubFile[];
		const markdownFiles = files.filter(
			(file) => file.name.endsWith(".md") || file.name.endsWith(".mdx"),
		);
		const posts = await Promise.all(
			markdownFiles.map(async (file) => {
				const loaded = await readPostFile(file.path);
				const frontmatter = parseFrontmatterToPost(loaded.content);
				const id = file.name.replace(/\.mdx?$/, "");
				return createPostObject(id, frontmatter, loaded.path, loaded.sha);
			}),
		);

		return { success: true, data: posts };
	} catch (error) {
		logger.error("Failed to list posts", error);
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function getPost(
	id: string,
	path?: string,
): Promise<ActionResult<Post>> {
	try {
		const loaded = await findPostFile(id, path);
		const frontmatter = parseFrontmatterToPost(loaded.content);

		return {
			success: true,
			data: createPostObject(id, frontmatter, loaded.path, loaded.sha),
		};
	} catch (error) {
		logger.error("Failed to get post", error, { postId: id });
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function createPost(
	input: CreatePostInput,
): Promise<ActionResult<string>> {
	try {
		const validated = CreatePostSchema.parse(input);
		const env = getGitHubEnv();
		const id = randomUUID();
		const path = getRepositoryFilePath(env.POSTS_PATH, id, ".md");
		if (!path) {
			return { success: false, error: "Invalid post id" };
		}
		const now = new Date().toISOString();
		const frontmatter: PostFrontmatter = {
			title: validated.title,
			content: sanitizeMarkdown(validated.content),
			published: validated.published,
			lang: validated.lang,
			author: validated.author || getCurrentUser(),
			article: validated.article,
			coverImage: validated.coverImage,
			createdAt: now,
			updatedAt: now,
			publishedDate: validated.published ? now : undefined,
		};

		await updateGitHubFile(
			path,
			generateFrontmatterText(frontmatter),
			`Create post: ${validated.title}`,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to create post", error);
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function updatePost(
	id: string,
	input: UpdatePostInput,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const validated = UpdatePostSchema.parse(input);
		const env = getGitHubEnv();
		const path = resolveContentPath(env.POSTS_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Post not found" };
		}
		const existingResult = await getPost(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Post");
		const now = new Date().toISOString();
		const published = validated.published ?? existing.published;
		const frontmatter: PostFrontmatter = {
			title: validated.title ?? existing.title,
			content: sanitizeMarkdown(validated.content ?? existing.content),
			published,
			lang: validated.lang ?? existing.lang,
			author: validated.author ?? existing.author ?? getCurrentUser(),
			article: validated.article ?? existing.article,
			coverImage: validated.coverImage ?? existing.coverImage,
			createdAt: existing.createdAt,
			updatedAt: now,
			publishedDate: published ? (existing.publishedAt ?? now) : undefined,
		};
		const sha = await updateGitHubFile(
			path,
			generateFrontmatterText(frontmatter),
			`Update post: ${validated.title ?? existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to update post", error, { postId: id });
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function deletePost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.POSTS_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Post not found" };
		}
		const octokit = getGitHubClient();
		await octokit.repos.deleteFile({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
			message: `Delete post: ${id}`,
			sha: revision.sha,
		});

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete post", error, { postId: id });
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function publishPost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.POSTS_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Post not found" };
		}
		const existingResult = await getPost(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Post");
		const now = new Date().toISOString();
		const frontmatter: PostFrontmatter = {
			title: existing.title,
			content: existing.content,
			published: true,
			lang: existing.lang,
			author: existing.author ?? getCurrentUser(),
			article: existing.article,
			coverImage: existing.coverImage,
			createdAt: existing.createdAt,
			updatedAt: now,
			publishedDate: now,
		};
		const sha = await updateGitHubFile(
			path,
			generateFrontmatterText(frontmatter),
			`Publish post: ${existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to publish post", error, { postId: id });
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}

export async function unpublishPost(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.POSTS_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Post not found" };
		}
		const existingResult = await getPost(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Post");
		const now = new Date().toISOString();
		const frontmatter: PostFrontmatter = {
			title: existing.title,
			content: existing.content,
			published: false,
			lang: existing.lang,
			author: existing.author ?? getCurrentUser(),
			article: existing.article,
			coverImage: existing.coverImage,
			createdAt: existing.createdAt,
			updatedAt: now,
		};
		const sha = await updateGitHubFile(
			path,
			generateFrontmatterText(frontmatter),
			`Unpublish post: ${existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to unpublish post", error, { postId: id });
		return { success: false, error: createContentErrorMessage(error, "Post") };
	}
}
