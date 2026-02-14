"use server";

import type { ActionResult } from "@/features/shared/shared.types";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import { getCurrentUser } from "@/lib/user";
import { logger, createSafeErrorMessage } from "@/lib/logger";
import { sanitizeMarkdown } from "@/lib/sanitize";
import {
  CreateArticleSchema,
  UpdateArticleSchema,
} from "@/lib/validation/article.schema";
import { cacheTag, refresh, updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import type { Article, ArticleFrontmatter, GitHubFile } from "./articles.types";
import { generateFrontmatter, parseArticleFrontmatter } from "./articles.utils";

const { ARTICLES_PATH, MEDIA_PATH: IMAGES_PATH } = githubRepoInfo;

async function fetchLatestSha(path: string): Promise<string | undefined> {
	try {
		const fileData = await octokit.repos.getContent({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path,
		});
		if (!Array.isArray(fileData.data) && "sha" in fileData.data) {
			return fileData.data.sha;
		}
	} catch (error) {
		logger.error("Failed to fetch latest file SHA", error, { path });
	}
	return undefined;
}

function createArticleObject(
	id: string,
	frontmatter: ArticleFrontmatter,
	body: string,
	sha?: string,
): Article {
	return {
		id,
		title: frontmatter.title,
		description: frontmatter.description,
		content: body,
		lang: frontmatter.lang,
		createdAt: frontmatter.createdAt || new Date().toISOString(),
		updatedAt: frontmatter.updatedAt || new Date().toISOString(),
		publishedAt: frontmatter.publishedDate,
		published: frontmatter.published,
		author: frontmatter.author,
		tags: frontmatter.tags,
		coverImage: frontmatter.coverImage,
		sha,
	};
}

async function updateGitHubFile(
	path: string,
	content: string,
	message: string,
	sha?: string,
): Promise<string | undefined> {
	const latestSha = sha ? await fetchLatestSha(path) : sha;
	const response = await octokit.repos.createOrUpdateFileContents({
		owner: githubRepoInfo.owner,
		repo: githubRepoInfo.repo,
		path,
		message,
		content: Buffer.from(content).toString("base64"),
		sha: latestSha || sha,
	});
	updateTag("articles");
	return response.data.content?.sha;
}

export async function listArticlesAction(): Promise<ActionResult<Article[]>> {
	"use cache";
	cacheTag("articles");
	try {
		const response = await octokit.repos.getContent({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path: ARTICLES_PATH,
		});

		if (!Array.isArray(response.data)) {
			return { success: true, data: [] };
		}

		const files = response.data as GitHubFile[];
		const mdFiles = files.filter(
			(f) => f.name.endsWith(".md") || f.name.endsWith(".mdx"),
		);

		const articles: Article[] = await Promise.all(
			mdFiles.map(async (file) => {
				const content = await getArticleContentAction(file.path);
				const { frontmatter, body } = parseArticleFrontmatter(content);
				const id = file.name.replace(/\.mdx?$/, "");
				return createArticleObject(id, frontmatter, body, file.sha);
			}),
		);

		const sorted = articles.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
		return { success: true, data: sorted };
	} catch (error) {
		logger.error("Failed to list articles", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function getArticleContentAction(path: string): Promise<string> {
	try {
		const response = await octokit.repos.getContent({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			throw new Error("Invalid file type");
		}

		const content = Buffer.from(response.data.content, "base64").toString(
			"utf-8",
		);
		return content;
	} catch (error) {
		logger.error("Failed to get article content", error, { path });
		throw error;
	}
}

export async function getArticleAction(
	id: string,
): Promise<ActionResult<Article>> {
	"use cache";
	cacheTag("articles");
	try {
		const path = `${ARTICLES_PATH}/${id}.md`;
		const response = await octokit.repos.getContent({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			return { success: false, error: "Article not found" };
		}

		const content = Buffer.from(response.data.content, "base64").toString(
			"utf-8",
		);
		const { frontmatter, body } = parseArticleFrontmatter(content);

		const article = createArticleObject(
			id,
			frontmatter,
			body,
			response.data.sha,
		);
		return { success: true, data: article };
	} catch (error) {
		logger.error("Failed to get article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function createArticleAction(
	input: unknown,
): Promise<ActionResult<string>> {
	try {
		const validatedInput = CreateArticleSchema.parse(input);
		const id = randomUUID();
		const now = new Date().toISOString();
		const { body: cleanContent } = parseArticleFrontmatter(
			sanitizeMarkdown(validatedInput.content),
		);
		const currentUser = getCurrentUser();

		const frontmatter = generateFrontmatter({
			title: validatedInput.title,
			description: validatedInput.description,
			published: validatedInput.published ?? false,
			lang: validatedInput.lang,
			tags: validatedInput.tags,
			coverImage: validatedInput.coverImage,
			author: validatedInput.author || currentUser,
			createdAt: now,
			updatedAt: now,
		});

		const fileContent = `${frontmatter}\n\n${cleanContent}`;
		const path = `${ARTICLES_PATH}/${id}.md`;

		await updateGitHubFile(
			path,
			fileContent,
			`Create article: ${validatedInput.title}`,
		);
		updateTag("articles");
		refresh();
		logger.info("Article created", { articleId: id, title: validatedInput.title });
		return { success: true, data: id };
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ERR_BAD_REQUEST") {
			logger.warn("Invalid article data provided", { error: error.message });
			return { success: false, error: "Invalid article data. Please check your input." };
		}
		logger.error("Failed to create article", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function updateArticleAction(
	id: string,
	input: unknown,
): Promise<ActionResult<boolean>> {
	try {
		const validatedInput = UpdateArticleSchema.parse(input);
		const result = await getArticleAction(id);

		if (!result.success || !result.data) {
			return { success: false, error: "Article not found" };
		}

		const existingArticle = result.data;

		const now = new Date().toISOString();
		const rawContent = validatedInput.content ?? existingArticle.content;
		const sanitized = sanitizeMarkdown(rawContent);
		const { body: cleanContent } = parseArticleFrontmatter(sanitized);

		const frontmatter = generateFrontmatter({
			title: validatedInput.title ?? existingArticle.title,
			description: validatedInput.description ?? existingArticle.description,
			published: validatedInput.published ?? existingArticle.published,
			lang: validatedInput.lang ?? existingArticle.lang,
			tags: validatedInput.tags ?? existingArticle.tags,
			coverImage: validatedInput.coverImage ?? existingArticle.coverImage,
			author: validatedInput.author ?? existingArticle.author,
			createdAt: existingArticle.createdAt,
			updatedAt: now,
		});

		const fileContent = `${frontmatter}\n\n${cleanContent}`;
		const path = `${ARTICLES_PATH}/${id}.md`;

		await updateGitHubFile(
			path,
			fileContent,
			`Update article: ${validatedInput.title ?? existingArticle.title}`,
			existingArticle.sha,
		);
		updateTag("articles");
		refresh();
		logger.info("Article updated", { articleId: id });
		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to update article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function deleteArticleAction(
	id: string,
	sha: string,
): Promise<ActionResult<boolean>> {
	try {
		const path = `${ARTICLES_PATH}/${id}.md`;

		await octokit.repos.deleteFile({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path,
			message: `Delete article: ${id}`,
			sha,
		});
		updateTag("articles");
		refresh();
		logger.info("Article deleted", { articleId: id });
		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function unpublishArticleAction(
	id: string,
	sha: string,
): Promise<ActionResult<boolean>> {
	try {
		const result = await getArticleAction(id);

		if (!result.success || !result.data) {
			return { success: false, error: "Article not found" };
		}

		const existingArticle = result.data;

		const now = new Date().toISOString();
		const frontmatter = generateFrontmatter({
			title: existingArticle.title,
			description: existingArticle.description,
			published: false,
			lang: existingArticle.lang,
			tags: existingArticle.tags,
			coverImage: existingArticle.coverImage,
			createdAt: existingArticle.createdAt,
			updatedAt: now,
		});

		const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
		const path = `${ARTICLES_PATH}/${id}.md`;

		await updateGitHubFile(
			path,
			fileContent,
			`Unpublish article: ${existingArticle.title}`,
			sha,
		);
		refresh();
		logger.info("Article unpublished", { articleId: id });
		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to unpublish article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function publishArticleAction(
	id: string,
	sha: string,
): Promise<ActionResult<boolean>> {
	try {
		const result = await getArticleAction(id);

		if (!result.success || !result.data) {
			return { success: false, error: "Article not found" };
		}

		const existingArticle = result.data;

		const now = new Date().toISOString();
		const frontmatter = generateFrontmatter({
			title: existingArticle.title,
			description: existingArticle.description,
			published: true,
			lang: existingArticle.lang,
			tags: existingArticle.tags,
			coverImage: existingArticle.coverImage,
			createdAt: existingArticle.createdAt,
			updatedAt: now,
		});

		const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
		const path = `${ARTICLES_PATH}/${id}.md`;

		await updateGitHubFile(
			path,
			fileContent,
			`Publish article: ${existingArticle.title}`,
			sha,
		);
		logger.info("Article published", { articleId: id });
		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to publish article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function updateArticleMetadataAction(
	id: string,
	metadata: {
		createdAt?: string;
		publishedDate?: string;
	},
): Promise<ActionResult<Article>> {
	try {
		const result = await getArticleAction(id);

		if (!result.success || !result.data) {
			return { success: false, error: "Article not found" };
		}

		const existingArticle = result.data;

		const now = new Date().toISOString();
		const frontmatter = generateFrontmatter({
			title: existingArticle.title,
			description: existingArticle.description,
			published: existingArticle.published,
			lang: existingArticle.lang,
			tags: existingArticle.tags,
			coverImage: existingArticle.coverImage,
			createdAt: metadata.createdAt ?? existingArticle.createdAt,
			updatedAt: now,
			publishedDate: metadata.publishedDate ?? existingArticle.publishedAt,
		});

		const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
		const path = `${ARTICLES_PATH}/${id}.md`;

		const updatedSha = await updateGitHubFile(
			path,
			fileContent,
			`Update article metadata: ${existingArticle.title}`,
			existingArticle.sha,
		);

		const updated = {
			...existingArticle,
			createdAt: metadata.createdAt ?? existingArticle.createdAt,
			publishedDate: metadata.publishedDate ?? existingArticle.publishedAt,
			updatedAt: now,
			sha: updatedSha,
		};
		logger.info("Article metadata updated", { articleId: id });
		return { success: true, data: updated };
	} catch (error) {
		logger.error("Failed to update article metadata", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function uploadImageAction(
	file: File,
	fileName: string,
): Promise<ActionResult<string>> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const content = Buffer.from(arrayBuffer).toString("base64");
		const path = `${IMAGES_PATH}/${fileName}`;

		await octokit.repos.createOrUpdateFileContents({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path,
			message: `Upload image: ${fileName}`,
			content,
		});

		const url = `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${path}`;
		logger.info("Image uploaded", { fileName, fileSize: file.size });
		return { success: true, data: url };
	} catch (error) {
		logger.error("Failed to upload image", error, { fileName });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}
