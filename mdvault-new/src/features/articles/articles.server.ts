import { randomUUID } from "node:crypto";
import {
	type CreateArticleInput,
	CreateArticleSchema,
	type UpdateArticleInput,
	UpdateArticleSchema,
} from "#/features/articles/article.schema";
import type {
	Article,
	ArticleFrontmatter,
	GitHubFile,
} from "#/features/articles/articles.types";
import {
	generateFrontmatter,
	parseArticleFrontmatter,
} from "#/features/articles/articles.utils";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { sanitizeMarkdown } from "#/lib/sanitize";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

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

async function getArticleContent(path: string) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const response = await octokit.repos.getContent({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
	});

	if (Array.isArray(response.data) || response.data.type !== "file") {
		throw new Error("Invalid file type");
	}

	return Buffer.from(response.data.content, "base64").toString("utf-8");
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
		logger.error("Failed to fetch latest article SHA", error, { path });
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

export async function listArticles(): Promise<ActionResult<Article[]>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: env.ARTICLES_PATH,
		});

		if (!Array.isArray(response.data)) {
			return { success: true, data: [] };
		}

		const files = response.data as GitHubFile[];
		const mdFiles = files.filter(
			(file) => file.name.endsWith(".md") || file.name.endsWith(".mdx"),
		);

		const articles = await Promise.all(
			mdFiles.map(async (file) => {
				const content = await getArticleContent(file.path);
				const { frontmatter, body } = parseArticleFrontmatter(content);
				const id = file.name.replace(/\.mdx?$/, "");
				return createArticleObject(id, frontmatter, body, file.sha);
			}),
		);

		return {
			success: true,
			data: articles.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		};
	} catch (error) {
		logger.error("Failed to list articles", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function getArticleStats() {
	const result = await listArticles();
	const articles = result.success ? result.data : [];

	return {
		totalArticles: articles.length,
		publishedArticles: articles.filter((article) => article.published).length,
		draftArticles: articles.filter((article) => !article.published).length,
	};
}

export async function getArticle(id: string): Promise<ActionResult<Article>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const path = `${env.ARTICLES_PATH}/${id}.md`;
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			return { success: false, error: "Article not found" };
		}

		const content = Buffer.from(response.data.content, "base64").toString(
			"utf-8",
		);
		const { frontmatter, body } = parseArticleFrontmatter(content);

		return {
			success: true,
			data: createArticleObject(id, frontmatter, body, response.data.sha),
		};
	} catch (error) {
		logger.error("Failed to get article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function createArticle(
	input: CreateArticleInput,
): Promise<ActionResult<string>> {
	try {
		const validated = CreateArticleSchema.parse(input);
		const env = getGitHubEnv();
		const id = randomUUID();
		const now = new Date().toISOString();
		const { body } = parseArticleFrontmatter(
			sanitizeMarkdown(validated.content),
		);
		const frontmatter = generateFrontmatter({
			title: validated.title,
			description: validated.description,
			published: validated.published,
			lang: validated.lang,
			tags: validated.tags,
			coverImage: validated.coverImage,
			author: validated.author || getCurrentUser(),
			createdAt: now,
			updatedAt: now,
			publishedDate: validated.published ? now : undefined,
		});

		await updateGitHubFile(
			`${env.ARTICLES_PATH}/${id}.md`,
			`${frontmatter}\n\n${body}`,
			`Create article: ${validated.title}`,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to create article", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function updateArticle(
	id: string,
	input: UpdateArticleInput,
): Promise<ActionResult<string>> {
	try {
		const validated = UpdateArticleSchema.parse(input);
		const env = getGitHubEnv();
		const existingResult = await getArticle(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		const now = new Date().toISOString();
		const rawContent = validated.content ?? existing.content;
		const { body } = parseArticleFrontmatter(sanitizeMarkdown(rawContent));
		const published = validated.published ?? existing.published;
		const frontmatter = generateFrontmatter({
			title: validated.title ?? existing.title,
			description: validated.description ?? existing.description,
			published,
			lang: validated.lang ?? existing.lang,
			tags: validated.tags ?? existing.tags,
			coverImage: validated.coverImage ?? existing.coverImage,
			author: validated.author ?? existing.author ?? getCurrentUser(),
			createdAt: existing.createdAt,
			updatedAt: now,
			publishedDate: published ? (existing.publishedAt ?? now) : undefined,
		});

		await updateGitHubFile(
			`${env.ARTICLES_PATH}/${id}.md`,
			`${frontmatter}\n\n${body}`,
			`Update article: ${validated.title ?? existing.title}`,
			existing.sha,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to update article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function deleteArticle(
	id: string,
	sha: string,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		await octokit.repos.deleteFile({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: `${env.ARTICLES_PATH}/${id}.md`,
			message: `Delete article: ${id}`,
			sha,
		});

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function publishArticle(
	id: string,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const existingResult = await getArticle(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		const now = new Date().toISOString();
		const frontmatter = generateFrontmatter({
			title: existing.title,
			description: existing.description,
			published: true,
			lang: existing.lang,
			tags: existing.tags,
			coverImage: existing.coverImage,
			author: existing.author ?? getCurrentUser(),
			createdAt: existing.createdAt,
			updatedAt: now,
			publishedDate: now,
		});

		await updateGitHubFile(
			`${env.ARTICLES_PATH}/${id}.md`,
			`${frontmatter}\n\n${existing.content}`,
			`Publish article: ${existing.title}`,
			existing.sha,
		);

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to publish article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function unpublishArticle(
	id: string,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const existingResult = await getArticle(id);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		const now = new Date().toISOString();
		const frontmatter = generateFrontmatter({
			title: existing.title,
			description: existing.description,
			published: false,
			lang: existing.lang,
			tags: existing.tags,
			coverImage: existing.coverImage,
			author: existing.author ?? getCurrentUser(),
			createdAt: existing.createdAt,
			updatedAt: now,
		});

		await updateGitHubFile(
			`${env.ARTICLES_PATH}/${id}.md`,
			`${frontmatter}\n\n${existing.content}`,
			`Unpublish article: ${existing.title}`,
			existing.sha,
		);

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to unpublish article", error, { articleId: id });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}
