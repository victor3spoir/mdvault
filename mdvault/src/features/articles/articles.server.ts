import { randomUUID } from "node:crypto";
import {
	type CreateArticleInput,
	CreateArticleSchema,
	type UpdateArticleInput,
	UpdateArticleSchema,
} from "#/features/articles/article.schema";
import {
	generateFrontmatter,
	parseArticleFrontmatter,
} from "#/features/articles/articles.frontmatter";
import type {
	Article,
	ArticleFrontmatter,
	GitHubFile,
} from "#/features/articles/articles.types";
import {
	assertContentRevision,
	type ContentMutationResult,
	ContentNotFoundError,
	type ContentRevision,
	getContentPathCandidates,
	resolveContentPath,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { runGitHubRead } from "#/integrations/github/github-read.server";
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

function createArticleObject(
	id: string,
	frontmatter: ArticleFrontmatter,
	body: string,
	path: string,
	sha: string,
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
		path,
		sha,
	};
}

async function readArticleFile(
	octokit: ReturnType<typeof getGitHubClient>,
	path: string,
) {
	const env = getGitHubEnv();
	const response = await octokit.repos.getContent({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path,
	});

	if (Array.isArray(response.data) || response.data.type !== "file") {
		throw new ContentNotFoundError("Article");
	}

	return {
		path,
		sha: response.data.sha,
		content: base64ToUtf8(response.data.content),
	};
}

async function findArticleFile(
	octokit: ReturnType<typeof getGitHubClient>,
	id: string,
	requestedPath?: string,
) {
	const env = getGitHubEnv();
	const paths = requestedPath
		? [resolveContentPath(env.ARTICLES_PATH, id, requestedPath)].filter(
				(path): path is string => path !== null,
			)
		: getContentPathCandidates(env.ARTICLES_PATH, id);

	if (paths.length === 0) {
		throw new ContentNotFoundError("Article");
	}

	for (const path of paths) {
		try {
			return await readArticleFile(octokit, path);
		} catch (error) {
			if (!isGitHubNotFoundError(error)) {
				throw error;
			}
		}
	}

	throw new ContentNotFoundError("Article");
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
		throw new Error("GitHub did not return the updated article revision");
	}

	return nextSha;
}

function getCurrentUser() {
	return getGitHubEnv().GITHUB_OWNER;
}

export async function listArticles(): Promise<ActionResult<Article[]>> {
	try {
		const articles = await runGitHubRead(async (octokit) => {
			const env = getGitHubEnv();
			const response = await octokit.repos.getContent({
				owner: env.GITHUB_OWNER,
				repo: env.GITHUB_REPO,
				path: env.ARTICLES_PATH,
			});

			if (!Array.isArray(response.data)) {
				return [];
			}

			const files = response.data as GitHubFile[];
			const markdownFiles = files.filter(
				(file) => file.name.endsWith(".md") || file.name.endsWith(".mdx"),
			);
			const parsedArticles = await Promise.all(
				markdownFiles.map(async (file) => {
					const loaded = await readArticleFile(octokit, file.path);
					const { frontmatter, body } = parseArticleFrontmatter(loaded.content);
					const id = file.name.replace(/\.mdx?$/, "");
					return createArticleObject(
						id,
						frontmatter,
						body,
						loaded.path,
						loaded.sha,
					);
				}),
			);

			return parsedArticles.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		});

		return { success: true, data: articles };
	} catch (error) {
		logger.error("Failed to list articles", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
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

export async function getArticle(
	id: string,
	path?: string,
): Promise<ActionResult<Article>> {
	try {
		return await runGitHubRead(async (octokit) => {
			const loaded = await findArticleFile(octokit, id, path);
			const { frontmatter, body } = parseArticleFrontmatter(loaded.content);

			return {
				success: true,
				data: createArticleObject(
					id,
					frontmatter,
					body,
					loaded.path,
					loaded.sha,
				),
			};
		});
	} catch (error) {
		logger.error("Failed to get article", error, { articleId: id });
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}

export async function createArticle(
	input: CreateArticleInput,
): Promise<ActionResult<string>> {
	try {
		const validated = CreateArticleSchema.parse(input);
		const env = getGitHubEnv();
		const id = randomUUID();
		const path = getRepositoryFilePath(env.ARTICLES_PATH, id, ".md");
		if (!path) {
			return { success: false, error: "Invalid article id" };
		}
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
			path,
			`${frontmatter}\n\n${body}`,
			`Create article: ${validated.title}`,
		);

		return { success: true, data: id };
	} catch (error) {
		logger.error("Failed to create article", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}

export async function updateArticle(
	id: string,
	input: UpdateArticleInput,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const validated = UpdateArticleSchema.parse(input);
		const env = getGitHubEnv();
		const path = resolveContentPath(env.ARTICLES_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Article not found" };
		}
		const existingResult = await getArticle(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Article");
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
		const sha = await updateGitHubFile(
			path,
			`${frontmatter}\n\n${body}`,
			`Update article: ${validated.title ?? existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to update article", error, { articleId: id });
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}

export async function deleteArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.ARTICLES_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Article not found" };
		}
		const octokit = getGitHubClient();
		await octokit.repos.deleteFile({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
			message: `Delete article: ${id}`,
			sha: revision.sha,
		});

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete article", error, { articleId: id });
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}

export async function publishArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.ARTICLES_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Article not found" };
		}
		const existingResult = await getArticle(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Article");
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
		const sha = await updateGitHubFile(
			path,
			`${frontmatter}\n\n${existing.content}`,
			`Publish article: ${existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to publish article", error, { articleId: id });
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}

export async function unpublishArticle(
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	try {
		const env = getGitHubEnv();
		const path = resolveContentPath(env.ARTICLES_PATH, id, revision.path);
		if (!path) {
			return { success: false, error: "Article not found" };
		}
		const existingResult = await getArticle(id, path);

		if (!existingResult.success) {
			return existingResult;
		}

		const existing = existingResult.data;
		assertContentRevision(revision.sha, existing.sha, "Article");
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
		const sha = await updateGitHubFile(
			path,
			`${frontmatter}\n\n${existing.content}`,
			`Unpublish article: ${existing.title}`,
			revision.sha,
		);

		return { success: true, data: { id, path, sha } };
	} catch (error) {
		logger.error("Failed to unpublish article", error, { articleId: id });
		return {
			success: false,
			error: createContentErrorMessage(error, "Article"),
		};
	}
}
