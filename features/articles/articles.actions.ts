"use server";

import type { ActionResult } from "@/features/shared/shared.types";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import {
  CreateArticleSchema,
  UpdateArticleSchema,
} from "@/lib/validation/article.schema";
import { cacheTag, updateTag } from "next/cache";
import type { Article, ArticleFrontmatter, GitHubFile } from "./articles.types";
import { generateFrontmatter, parseFrontmatter } from "./articles.utils";

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
    console.error("Failed to fetch latest file SHA:", error);
  }
  return undefined;
}

function createArticleObject(
  slug: string,
  frontmatter: ArticleFrontmatter,
  body: string,
  sha?: string,
): Article {
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    content: body,
    createdAt: frontmatter.createdAt || new Date().toISOString(),
    updatedAt: frontmatter.updatedAt || new Date().toISOString(),
    publishedDate: frontmatter.publishedDate,
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
        const { frontmatter, body } = parseFrontmatter(content);
        const slug = file.name.replace(/\.mdx?$/, "");
        return createArticleObject(slug, frontmatter, body, file.sha);
      }),
    );

    const sorted = articles.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return { success: true, data: sorted };
  } catch (error) {
    console.error("Error listing articles:", error);
    return { success: false, error: "Failed to list articles" };
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
      throw new Error("Not a file");
    }

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
    );
    return content;
  } catch (error) {
    console.error("Error getting article content:", error);
    throw error;
  }
}

export async function getArticleAction(
  slug: string,
): Promise<ActionResult<Article | null>> {
  try {
    const path = `${ARTICLES_PATH}/${slug}.md`;
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
    });

    if (Array.isArray(response.data) || response.data.type !== "file") {
      return { success: true, data: null };
    }

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
    );
    const { frontmatter, body } = parseFrontmatter(content);

    const article = createArticleObject(
      slug,
      frontmatter,
      body,
      response.data.sha,
    );
    return { success: true, data: article };
  } catch (error) {
    console.error("Error getting article:", error);
    return { success: false, error: "Failed to get article" };
  }
}

export async function createArticleAction(
  input: unknown,
): Promise<ActionResult<Article>> {
  try {
    const validatedInput = CreateArticleSchema.parse(input);
    const now = new Date().toISOString();
    const { body: cleanContent } = parseFrontmatter(validatedInput.content);

    const frontmatter = generateFrontmatter({
      title: validatedInput.title,
      description: validatedInput.description,
      published: validatedInput.published ?? false,
      tags: validatedInput.tags,
      coverImage: validatedInput.coverImage,
      createdAt: now,
      updatedAt: now,
    });

    const fileContent = `${frontmatter}\n\n${cleanContent}`;
    const path = `${ARTICLES_PATH}/${validatedInput.slug}.md`;

    const sha = await updateGitHubFile(
      path,
      fileContent,
      `Create article: ${validatedInput.title}`,
    );

    const article = createArticleObject(
      validatedInput.slug,
      {
        ...validatedInput,
        published: validatedInput.published ?? false,
        createdAt: now,
        updatedAt: now,
      } as ArticleFrontmatter,
      cleanContent,
      sha,
    );
    return { success: true, data: article };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create article";
    return { success: false, error: message };
  }
}

export async function updateArticleAction(
  slug: string,
  input: unknown,
): Promise<ActionResult<Article>> {
  try {
    const validatedInput = UpdateArticleSchema.parse(input);
    const result = await getArticleAction(slug);

    if (!result.success || !result.data) {
      return { success: false, error: "Article not found" };
    }

    const existingArticle = result.data;

    const now = new Date().toISOString();
    const rawContent = validatedInput.content ?? existingArticle.content;
    const { body: cleanContent } = parseFrontmatter(rawContent);

    const frontmatter = generateFrontmatter({
      title: validatedInput.title ?? existingArticle.title,
      description: validatedInput.description ?? existingArticle.description,
      published: validatedInput.published ?? existingArticle.published,
      tags: validatedInput.tags ?? existingArticle.tags,
      coverImage: validatedInput.coverImage ?? existingArticle.coverImage,
      createdAt: existingArticle.createdAt,
      updatedAt: now,
    });

    const fileContent = `${frontmatter}\n\n${cleanContent}`;
    const path = `${ARTICLES_PATH}/${slug}.md`;

    const sha = await updateGitHubFile(
      path,
      fileContent,
      `Update article: ${validatedInput.title ?? existingArticle.title}`,
      existingArticle.sha,
    );

    const updated = {
      ...existingArticle,
      title: validatedInput.title ?? existingArticle.title,
      description: validatedInput.description ?? existingArticle.description,
      content: cleanContent,
      updatedAt: now,
      published: validatedInput.published ?? existingArticle.published,
      tags: validatedInput.tags ?? existingArticle.tags,
      coverImage: validatedInput.coverImage ?? existingArticle.coverImage,
      sha,
    };
    return { success: true, data: updated };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update article";
    return { success: false, error: message };
  }
}

export async function deleteArticleAction(
  slug: string,
  sha: string,
): Promise<ActionResult<void>> {
  try {
    const path = `${ARTICLES_PATH}/${slug}.md`;

    await octokit.repos.deleteFile({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
      message: `Delete article: ${slug}`,
      sha,
    });
    updateTag("articles");
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete article";
    return { success: false, error: message };
  }
}

export async function unpublishArticleAction(
  slug: string,
  sha: string,
): Promise<ActionResult<Article>> {
  try {
    const result = await getArticleAction(slug);

    if (!result.success || !result.data) {
      return { success: false, error: "Article not found" };
    }

    const existingArticle = result.data;

    const now = new Date().toISOString();
    const frontmatter = generateFrontmatter({
      title: existingArticle.title,
      description: existingArticle.description,
      published: false,
      tags: existingArticle.tags,
      coverImage: existingArticle.coverImage,
      createdAt: existingArticle.createdAt,
      updatedAt: now,
    });

    const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
    const path = `${ARTICLES_PATH}/${slug}.md`;

    const updatedSha = await updateGitHubFile(
      path,
      fileContent,
      `Unpublish article: ${existingArticle.title}`,
      sha,
    );

    const updated = {
      ...existingArticle,
      published: false,
      updatedAt: now,
      sha: updatedSha,
    };
    return { success: true, data: updated };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unpublish article";
    return { success: false, error: message };
  }
}

export async function publishArticleAction(
  slug: string,
  sha: string,
): Promise<ActionResult<Article>> {
  try {
    const result = await getArticleAction(slug);

    if (!result.success || !result.data) {
      return { success: false, error: "Article not found" };
    }

    const existingArticle = result.data;

    const now = new Date().toISOString();
    const frontmatter = generateFrontmatter({
      title: existingArticle.title,
      description: existingArticle.description,
      published: true,
      tags: existingArticle.tags,
      coverImage: existingArticle.coverImage,
      createdAt: existingArticle.createdAt,
      updatedAt: now,
    });

    const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
    const path = `${ARTICLES_PATH}/${slug}.md`;

    const updatedSha = await updateGitHubFile(
      path,
      fileContent,
      `Publish article: ${existingArticle.title}`,
      sha,
    );

    const updated = {
      ...existingArticle,
      published: true,
      updatedAt: now,
      sha: updatedSha,
    };
    return { success: true, data: updated };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish article";
    return { success: false, error: message };
  }
}

export async function updateArticleMetadataAction(
  slug: string,
  metadata: {
    createdAt?: string;
    publishedDate?: string;
  },
): Promise<ActionResult<Article>> {
  try {
    const result = await getArticleAction(slug);

    if (!result.success || !result.data) {
      return { success: false, error: "Article not found" };
    }

    const existingArticle = result.data;

    const now = new Date().toISOString();
    const frontmatter = generateFrontmatter({
      title: existingArticle.title,
      description: existingArticle.description,
      published: existingArticle.published,
      tags: existingArticle.tags,
      coverImage: existingArticle.coverImage,
      createdAt: metadata.createdAt ?? existingArticle.createdAt,
      updatedAt: now,
      publishedDate: metadata.publishedDate ?? existingArticle.publishedDate,
    });

    const fileContent = `${frontmatter}\n\n${existingArticle.content}`;
    const path = `${ARTICLES_PATH}/${slug}.md`;

    const updatedSha = await updateGitHubFile(
      path,
      fileContent,
      `Update article metadata: ${existingArticle.title}`,
      existingArticle.sha,
    );

    const updated = {
      ...existingArticle,
      createdAt: metadata.createdAt ?? existingArticle.createdAt,
      publishedDate: metadata.publishedDate ?? existingArticle.publishedDate,
      updatedAt: now,
      sha: updatedSha,
    };
    return { success: true, data: updated };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update article metadata";
    return { success: false, error: message };
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
    return { success: true, data: url };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image";
    return { success: false, error: message };
  }
}
