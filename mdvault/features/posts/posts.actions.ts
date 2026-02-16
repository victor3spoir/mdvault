"use server";

import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import { cacheTag, refresh, updateTag } from "next/cache";
import type { ActionResult } from "@/features/shared/shared.types";
import { createSafeErrorMessage, logger } from "@/lib/logger";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import { sanitizeMarkdown } from "@/lib/sanitize";
import { getCurrentUser } from "@/lib/user";
import {
  CreatePostSchema,
  UpdatePostSchema,
} from "@/lib/validation/post.schema";
import type { GitHubFile, Post, PostFrontmatter } from "./posts.types";

const POSTS_PATH = githubRepoInfo.POSTS_PATH;

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
  updateTag("posts");
  return response.data.content?.sha;
}

export async function listPostsAction(): Promise<ActionResult<Post[]>> {
  "use cache";
  cacheTag("posts");
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: POSTS_PATH,
    });

    if (!Array.isArray(response.data)) {
      return { success: true, data: [] };
    }

    const files = response.data as GitHubFile[];
    const mdFiles = files.filter((f) => f.name.endsWith(".md"));

    const posts: Post[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await getPostContentAction(file.path);
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

async function getPostContentAction(path: string): Promise<string> {
  const response = await octokit.repos.getContent({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
  });

  if (Array.isArray(response.data)) {
    throw new Error("Path is a directory, not a file");
  }

  const fileData = response.data as {
    content: string;
    encoding: string;
  };
  const content = Buffer.from(fileData.content, "base64").toString("utf-8");
  return content;
}

function parseFrontmatterToPost(content: string): PostFrontmatter {
  const { data, content: body } = matter(content);

  const frontmatter: PostFrontmatter = {
    title: (data.title as string) || "Untitled",
    content: body.trim(),
    published: (data.published as boolean) || false,
    lang:
      (data.lang as "fr" | "en") === "fr" || (data.lang as "fr" | "en") === "en"
        ? (data.lang as "fr" | "en")
        : "en",
  };

  if (data.author) frontmatter.author = data.author as string;
  if (data.article) frontmatter.article = data.article as string;
  if (data.coverImage) frontmatter.coverImage = data.coverImage as string;
  if (data.createdAt) frontmatter.createdAt = data.createdAt as string;
  if (data.updatedAt) frontmatter.updatedAt = data.updatedAt as string;
  if (data.publishedDate)
    frontmatter.publishedDate = data.publishedDate as string;

  return frontmatter;
}

function generateFrontmatterText(data: PostFrontmatter): string {
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

export async function getPostAction(id: string): Promise<ActionResult<Post>> {
  try {
    const path = `${POSTS_PATH}/${id}.md`;
    const content = await getPostContentAction(path);
    const frontmatter = parseFrontmatterToPost(content);
    const sha = await fetchLatestSha(path);

    return {
      success: true,
      data: createPostObject(id, frontmatter, sha),
    };
  } catch (error) {
    logger.error("Failed to get post", error, { postId: id });
    return { success: false, error: createSafeErrorMessage(error) };
  }
}

export async function createPostAction(input: {
  title: string;
  content: string;
  published: boolean;
  lang: "fr" | "en";
  coverImage?: string;
  article?: string;
  author?: string;
}): Promise<ActionResult<boolean>> {
  try {
    // Validate using Zod schema
    const validatedData = CreatePostSchema.parse(input);

    const id = randomUUID();
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    const frontmatter: PostFrontmatter = {
      title: validatedData.title,
      content: sanitizeMarkdown(validatedData.content),
      published: validatedData.published,
      lang: validatedData.lang,
      author: validatedData.author || currentUser,
      article: validatedData.article,
      coverImage: validatedData.coverImage,
      createdAt: now,
      updatedAt: now,
    };

    const frontmatter_text = generateFrontmatterText(frontmatter);

    const path = `${POSTS_PATH}/${id}.md`;
    await updateGitHubFile(
      path,
      frontmatter_text,
      `Create post: ${validatedData.title}`,
    );
    logger.info("Post created", { postId: id, title: validatedData.title });
    updateTag("posts");
    refresh();

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    logger.error("Failed to create post", error);
    return { success: false, error: createSafeErrorMessage(error) };
  }
}

export async function updatePostAction(
  id: string,
  input: {
    title: string;
    content: string;
    published: boolean;
    lang: "fr" | "en";
    coverImage?: string;
    article?: string;
    author?: string;
    sha: string;
    createdAt: string;
  },
): Promise<ActionResult<boolean>> {
  try {
    // Validate using Zod schema
    const validatedData = UpdatePostSchema.parse(input);

    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    const frontmatter: PostFrontmatter = {
      title: validatedData.title ?? input.title,
      content: sanitizeMarkdown(validatedData.content ?? input.content),
      published: validatedData.published ?? input.published,
      lang: validatedData.lang ?? input.lang,
      author: validatedData.author || currentUser,
      article: validatedData.article,
      coverImage: validatedData.coverImage,
      createdAt: input.createdAt,
      updatedAt: now,
    };

    const frontmatter_text = generateFrontmatterText(frontmatter);

    const path = `${POSTS_PATH}/${id}.md`;
    await updateGitHubFile(
      path,
      frontmatter_text,
      `Update post: ${validatedData.title ?? input.title}`,
      input.sha,
    );
    logger.info("Post updated", { postId: id });
    updateTag("posts");
    refresh();

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    logger.error("Failed to update post", error, { postId: id });
    return { success: false, error: createSafeErrorMessage(error) };
  }
}

export async function deletePostAction(
  id: string,
  sha: string,
): Promise<ActionResult<boolean>> {
  try {
    const path = `${POSTS_PATH}/${id}.md`;
    const latestSha = await fetchLatestSha(path);

    await octokit.repos.deleteFile({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
      message: `Delete post: ${id}`,
      sha: latestSha || sha,
    });

    logger.info("Post deleted", { postId: id });
    updateTag("posts");
    refresh();
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete post", error, { postId: id });
    return { success: false, error: createSafeErrorMessage(error) };
  }
}

export async function publishPostAction(
  id: string,
  sha: string,
  createdAt: string,
): Promise<ActionResult<boolean>> {
  try {
    const path = `${POSTS_PATH}/${id}.md`;
    const content = await getPostContentAction(path);
    const frontmatter = parseFrontmatterToPost(content);

    const now = new Date().toISOString();
    frontmatter.published = true;
    frontmatter.publishedDate = now;
    frontmatter.createdAt = createdAt;

    const frontmatter_text = generateFrontmatterText(frontmatter);

    await updateGitHubFile(
      path,
      frontmatter_text,
      `Publish post: ${frontmatter.title}`,
      sha,
    );
    logger.info("Post published", { postId: id });
    updateTag("posts");
    refresh();

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    logger.error("Failed to publish post", error, { postId: id });
    return { success: false, error: createSafeErrorMessage(error) };
  }
}

export async function unpublishPostAction(
  id: string,
  sha: string,
  createdAt: string,
): Promise<ActionResult<boolean>> {
  try {
    const path = `${POSTS_PATH}/${id}.md`;
    const content = await getPostContentAction(path);
    const frontmatter = parseFrontmatterToPost(content);

    frontmatter.published = false;
    frontmatter.createdAt = createdAt;

    const frontmatter_text = generateFrontmatterText(frontmatter);

    await updateGitHubFile(
      path,
      frontmatter_text,
      `Unpublish post: ${frontmatter.title}`,
      sha,
    );
    logger.info("Post unpublished", { postId: id });
    refresh();
    updateTag("posts");

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    logger.error("Failed to unpublish post", error, { postId: id });
    return { success: false, error: createSafeErrorMessage(error) };
  }
}
