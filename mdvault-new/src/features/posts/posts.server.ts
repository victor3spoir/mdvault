import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import {
	type CreatePostInput,
	CreatePostSchema,
	type UpdatePostInput,
	UpdatePostSchema,
} from "#/features/posts/post.schema";
import type {
	GitHubFile,
	Post,
	PostFrontmatter,
} from "#/features/posts/posts.types";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { sanitizeMarkdown } from "#/lib/sanitize";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

function createPostObject(
	id: string,
	frontmatter: PostFrontmatter,
	sha?: string,
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
		sha,
	};
}

function parseFrontmatterToPost(content: string): PostFrontmatter {
	const { data, content: body } = matter(content);

	return {
		title: (data.title as string) || "Untitled",
		content: body.trim(),
		published: (data.published as boolean) || false,
		lang:
			(data.lang as "fr" | "en") === "fr" || (data.lang as "fr" | "en") === "en"
				? (data.lang as "fr" | "en")
				: "en",
		author: data.author as string | undefined,
		article: data.article as string | undefined,
		coverImage:
			typeof data.coverImage === "string" ? data.coverImage.trim() : undefined,
		createdAt: data.createdAt as string | undefined,
		updatedAt: data.updatedAt as string | undefined,
		publishedDate: data.publishedDate as string | undefined,
	};
}

async function getPostContent(path: string) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const response = await octokit.repos.getContent({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
	});

	if (Array.isArray(response.data)) {
		throw new Error("Path is a directory, not a file");
	}

	return Buffer.from(response.data.content, "base64").toString("utf-8");
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

async function fetchLatestSha(path: string) {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
		});

		if (!Array.isArray(response.data) && "sha" in response.data) {
			return response.data.sha;
		}
	} catch (error) {
		logger.error("Failed to fetch latest post SHA", error, { path });
	}

	return undefined;
}

async function updateGitHubFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const latestSha = sha ? await fetchLatestSha(path) : sha;
	const response = await octokit.repos.createOrUpdateFileContents({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
		message,
		content: Buffer.from(content).toString("base64"),
		sha: latestSha || sha,
	});

	return response.data.content?.sha;
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
		const mdFiles = files.filter((file) => file.name.endsWith(".md"));

		const posts = await Promise.all(
			mdFiles.map(async (file) => {
				const content = await getPostContent(file.path);
				const frontmatter = parseFrontmatterToPost(content);
				const id = file.name.replace(".md", "");
				return createPostObject(id, frontmatter, file.sha);
			}),
		);

		return { success: true, data: posts };
	} catch (error) {
		logger.error("Failed to list posts", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function getPost(id: string): Promise<ActionResult<Post>> {
	try {
		const env = getGitHubEnv();
		const content = await getPostContent(`${env.POSTS_PATH}/${id}.md`);
		const frontmatter = parseFrontmatterToPost(content);
		const sha = await fetchLatestSha(`${env.POSTS_PATH}/${id}.md`);

		return {
			success: true,
			data: createPostObject(id, frontmatter, sha),
		};
	} catch (error) {
		logger.error("Failed to get post", error, { postId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function createPost(
	input: CreatePostInput,
): Promise<ActionResult<string>> {
	try {
		const validated = CreatePostSchema.parse(input);
		const env = getGitHubEnv();
		const id = randomUUID();
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
			`${env.POSTS_PATH}/${id}.md`,
			generateFrontmatterText(frontmatter),
			`Create post: ${validated.title}`,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to create post", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function updatePost(
	id: string,
	input: UpdatePostInput,
): Promise<ActionResult<string>> {
	try {
		const validated = UpdatePostSchema.parse(input);
		const env = getGitHubEnv();
		const existingResult = await getPost(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
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

		await updateGitHubFile(
			`${env.POSTS_PATH}/${id}.md`,
			generateFrontmatterText(frontmatter),
			`Update post: ${validated.title ?? existing.title}`,
			existing.sha,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to update post", error, { postId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function deletePost(
	id: string,
	sha: string,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		await octokit.repos.deleteFile({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: `${env.POSTS_PATH}/${id}.md`,
			message: `Delete post: ${id}`,
			sha: (await fetchLatestSha(`${env.POSTS_PATH}/${id}.md`)) || sha,
		});

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete post", error, { postId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function publishPost(id: string): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const existingResult = await getPost(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
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

		await updateGitHubFile(
			`${env.POSTS_PATH}/${id}.md`,
			generateFrontmatterText(frontmatter),
			`Publish post: ${existing.title}`,
			existing.sha,
		);

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to publish post", error, { postId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function unpublishPost(
	id: string,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const existingResult = await getPost(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
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

		await updateGitHubFile(
			`${env.POSTS_PATH}/${id}.md`,
			generateFrontmatterText(frontmatter),
			`Unpublish post: ${existing.title}`,
			existing.sha,
		);

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to unpublish post", error, { postId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}
