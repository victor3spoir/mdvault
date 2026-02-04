"use server";

import type { ActionResult } from "@/features/shared/shared.types";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import { getCurrentUser } from "@/lib/user";
import { cacheTag, updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import type { GitHubFile, Post, PostFrontmatter } from "./posts.types";

const POSTS_PATH = "posts";

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
  id: string,
  frontmatter: PostFrontmatter,
  sha?: string,
): Post {
  return {
    id,
    title: frontmatter.title,
    content: frontmatter.content,
    createdAt: frontmatter.createdAt || new Date().toISOString(),
    updatedAt: frontmatter.updatedAt || new Date().toISOString(),
    publishedAt: frontmatter.publishedDate,
    published: frontmatter.published,
    author: frontmatter.author,
    link: frontmatter.link,
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
    console.error("Failed to list posts:", error);
    return { success: false, error: "Failed to list posts" };
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
  const lines = content.split("\n");
  if (!lines[0].includes("---")) {
    return {
      title: "Untitled",
      content,
      published: false,
    };
  }

  let frontmatterEnd = 1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes("---")) {
      frontmatterEnd = i;
      break;
    }
  }

  const frontmatterLines = lines.slice(1, frontmatterEnd);
  const bodyLines = lines.slice(frontmatterEnd + 1);

  const frontmatter: PostFrontmatter = {
    title: "Untitled",
    content: bodyLines.join("\n").trim(),
    published: false,
  };

  for (const line of frontmatterLines) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    if (key.trim() === "title") {
      frontmatter.title = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "published") {
      frontmatter.published = value.toLowerCase() === "true";
    } else if (key.trim() === "author") {
      frontmatter.author = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "link") {
      frontmatter.link = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "coverImage") {
      frontmatter.coverImage = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "createdAt") {
      frontmatter.createdAt = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "updatedAt") {
      frontmatter.updatedAt = value.replace(/^["']|["']$/g, "");
    } else if (key.trim() === "publishedDate") {
      frontmatter.publishedDate = value.replace(/^["']|["']$/g, "");
    }
  }

  return frontmatter;
}

function generateFrontmatterText(data: PostFrontmatter): string {
  let frontmatter = "---\n";
  frontmatter += `title: "${data.title}"\n`;
  frontmatter += `published: ${data.published}\n`;

  if (data.author) frontmatter += `author: "${data.author}"\n`;
  if (data.link) frontmatter += `link: "${data.link}"\n`;
  if (data.coverImage) frontmatter += `coverImage: "${data.coverImage}"\n`;
  if (data.createdAt) frontmatter += `createdAt: "${data.createdAt}"\n`;
  if (data.updatedAt) frontmatter += `updatedAt: "${data.updatedAt}"\n`;
  if (data.publishedDate)
    frontmatter += `publishedDate: "${data.publishedDate}"\n`;

  frontmatter += "---\n";
  return frontmatter;
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
    console.error("Failed to get post:", error);
    return { success: false, error: "Failed to get post" };
  }
}

export async function createPostAction(input: {
  title: string;
  content: string;
  published: boolean;
  coverImage?: string;
  link?: string;
  author?: string;
}): Promise<ActionResult<boolean>> {
  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    const frontmatter: PostFrontmatter = {
      title: input.title,
      content: input.content,
      published: input.published,
      author: input.author || currentUser,
      link: input.link,
      coverImage: input.coverImage,
      createdAt: now,
      updatedAt: now,
    };

    const frontmatterText = generateFrontmatterText(frontmatter);
    const fileContent = `${frontmatterText}${input.content}\n`;

    const path = `${POSTS_PATH}/${id}.md`;
    await updateGitHubFile(path, fileContent, `Create post: ${input.title}`);

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updatePostAction(
  id: string,
  input: {
    title: string;
    content: string;
    published: boolean;
    coverImage?: string;
    link?: string;
    author?: string;
    sha: string;
    createdAt: string;
  },
): Promise<ActionResult<boolean>> {
  try {
    const now = new Date().toISOString();
    const currentUser = getCurrentUser();
    const frontmatter: PostFrontmatter = {
      title: input.title,
      content: input.content,
      published: input.published,
      author: input.author || currentUser,
      link: input.link,
      coverImage: input.coverImage,
      createdAt: input.createdAt,
      updatedAt: now,
    };

    const frontmatterText = generateFrontmatterText(frontmatter);
    const fileContent = `${frontmatterText}${input.content}\n`;

    const path = `${POSTS_PATH}/${id}.md`;
    await updateGitHubFile(
      path,
      fileContent,
      `Update post: ${input.title}`,
      input.sha,
    );

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Failed to update post:", error);
    return { success: false, error: "Failed to update post" };
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

    updateTag("posts");
    return { success: true, data: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
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

    const frontmatterText = generateFrontmatterText(frontmatter);
    const fileContent = `${frontmatterText}${frontmatter.content}\n`;

    await updateGitHubFile(
      path,
      fileContent,
      `Publish post: ${frontmatter.title}`,
      sha,
    );

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Failed to publish post:", error);
    return { success: false, error: "Failed to publish post" };
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

    const frontmatterText = generateFrontmatterText(frontmatter);
    const fileContent = `${frontmatterText}${frontmatter.content}\n`;

    await updateGitHubFile(
      path,
      fileContent,
      `Unpublish post: ${frontmatter.title}`,
      sha,
    );

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Failed to unpublish post:", error);
    return { success: false, error: "Failed to unpublish post" };
  }
}
