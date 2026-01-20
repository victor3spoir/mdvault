"use server";

import { cacheTag, updateTag } from "next/cache";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import {
  CreateArticleSchema,
  UpdateArticleSchema,
} from "@/lib/validation/article.schema";
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

function createPostObject(
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

export async function listArticlesAction(): Promise<Article[]> {
  "use cache";
  cacheTag("articles");
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: ARTICLES_PATH,
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    const files = response.data as GitHubFile[];
    const mdFiles = files.filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".mdx"),
    );

    const posts: Article[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await getArticleContentAction(file.path);
        const { frontmatter, body } = parseFrontmatter(content);
        const slug = file.name.replace(/\.mdx?$/, "");
        return createPostObject(slug, frontmatter, body, file.sha);
      }),
    );

    return posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error("Error listing posts:", error);
    return [];
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

export async function getArticleAction(slug: string): Promise<Article | null> {
  try {
    const path = `${ARTICLES_PATH}/${slug}.md`;
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
    });

    if (Array.isArray(response.data) || response.data.type !== "file") {
      return null;
    }

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
    );
    const { frontmatter, body } = parseFrontmatter(content);

    return createPostObject(slug, frontmatter, body, response.data.sha);
  } catch (error) {
    console.error("Error getting article:", error);
    return null;
  }
}

export async function createArticleAction(input: unknown): Promise<Article> {
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

  return createPostObject(
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
}

export async function updateArticleAction(
  slug: string,
  input: unknown,
): Promise<Article> {
  const validatedInput = UpdateArticleSchema.parse(input);
  const existingPost = await getArticleAction(slug);
  if (!existingPost) {
    throw new Error("Article not found");
  }

  const now = new Date().toISOString();
  const rawContent = validatedInput.content ?? existingPost.content;
  const { body: cleanContent } = parseFrontmatter(rawContent);

  const frontmatter = generateFrontmatter({
    title: validatedInput.title ?? existingPost.title,
    description: validatedInput.description ?? existingPost.description,
    published: validatedInput.published ?? existingPost.published,
    tags: validatedInput.tags ?? existingPost.tags,
    coverImage: validatedInput.coverImage ?? existingPost.coverImage,
    createdAt: existingPost.createdAt,
    updatedAt: now,
  });

  const fileContent = `${frontmatter}\n\n${cleanContent}`;
  const path = `${ARTICLES_PATH}/${slug}.md`;

  const sha = await updateGitHubFile(
    path,
    fileContent,
    `Update article: ${validatedInput.title ?? existingPost.title}`,
    existingPost.sha,
  );

  return {
    ...existingPost,
    title: validatedInput.title ?? existingPost.title,
    description: validatedInput.description ?? existingPost.description,
    content: cleanContent,
    updatedAt: now,
    published: validatedInput.published ?? existingPost.published,
    tags: validatedInput.tags ?? existingPost.tags,
    coverImage: validatedInput.coverImage ?? existingPost.coverImage,
    sha,
  };
}

export async function deleteArticleAction(
  slug: string,
  sha: string,
): Promise<void> {
  const path = `${ARTICLES_PATH}/${slug}.md`;

  await octokit.repos.deleteFile({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Delete article: ${slug}`,
    sha,
  });
  updateTag("articles");
}

export async function unpublishArticleAction(
  slug: string,
  sha: string,
): Promise<Article> {
  const existingPost = await getArticleAction(slug);
  if (!existingPost) {
    throw new Error("Article not found");
  }

  const now = new Date().toISOString();
  const frontmatter = generateFrontmatter({
    title: existingPost.title,
    description: existingPost.description,
    published: false,
    tags: existingPost.tags,
    coverImage: existingPost.coverImage,
    createdAt: existingPost.createdAt,
    updatedAt: now,
  });

  const fileContent = `${frontmatter}\n\n${existingPost.content}`;
  const path = `${ARTICLES_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Unpublish article: ${existingPost.title}`,
    sha,
  );

  return {
    ...existingPost,
    published: false,
    updatedAt: now,
    sha: updatedSha,
  };
}

export async function publishArticleAction(
  slug: string,
  sha: string,
): Promise<Article> {
  const existingPost = await getArticleAction(slug);
  if (!existingPost) {
    throw new Error("Article not found");
  }

  const now = new Date().toISOString();
  const frontmatter = generateFrontmatter({
    title: existingPost.title,
    description: existingPost.description,
    published: true,
    tags: existingPost.tags,
    coverImage: existingPost.coverImage,
    createdAt: existingPost.createdAt,
    updatedAt: now,
  });

  const fileContent = `${frontmatter}\n\n${existingPost.content}`;
  const path = `${ARTICLES_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Publish article: ${existingPost.title}`,
    sha,
  );

  return {
    ...existingPost,
    published: true,
    updatedAt: now,
    sha: updatedSha,
  };
}

export async function updateArticleMetadataAction(
  slug: string,
  metadata: {
    createdAt?: string;
    publishedDate?: string;
  },
): Promise<Article> {
  const existingPost = await getArticleAction(slug);
  if (!existingPost) {
    throw new Error("Article not found");
  }

  const now = new Date().toISOString();
  const frontmatter = generateFrontmatter({
    title: existingPost.title,
    description: existingPost.description,
    published: existingPost.published,
    tags: existingPost.tags,
    coverImage: existingPost.coverImage,
    createdAt: metadata.createdAt ?? existingPost.createdAt,
    updatedAt: now,
    publishedDate: metadata.publishedDate ?? existingPost.publishedDate,
  });

  const fileContent = `${frontmatter}\n\n${existingPost.content}`;
  const path = `${ARTICLES_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Update article metadata: ${existingPost.title}`,
    existingPost.sha,
  );

  return {
    ...existingPost,
    createdAt: metadata.createdAt ?? existingPost.createdAt,
    publishedDate: metadata.publishedDate ?? existingPost.publishedDate,
    updatedAt: now,
    sha: updatedSha,
  };
}

export async function uploadImageAction(
  file: File,
  fileName: string,
): Promise<string> {
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

  return `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${path}`;
}
