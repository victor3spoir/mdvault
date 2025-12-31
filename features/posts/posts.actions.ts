"use server";

import octokit, { githubRepoInfo } from "@/lib/octokit";
import {
  CreatePostSchema,
  UpdatePostSchema,
} from "@/lib/validation/post.schema";
import { cacheTag, updateTag } from "next/cache";
import type { GitHubFile, Post, PostFrontmatter } from "./posts.types";
import { generateFrontmatter, parseFrontmatter } from "./posts.utils";

const { POSTS_PATH, IMAGES_PATH } = githubRepoInfo;

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
  frontmatter: PostFrontmatter,
  body: string,
  sha?: string,
): Post {
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
  updateTag("posts");
  return response.data.content?.sha;
}

export async function listPostsAction(): Promise<Post[]> {
  "use cache";
  cacheTag("posts");
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: POSTS_PATH,
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    const files = response.data as GitHubFile[];
    const mdFiles = files.filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".mdx"),
    );

    const posts: Post[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await getPostContentAction(file.path);
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

export async function getPostContentAction(path: string): Promise<string> {
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
    console.error("Error getting post content:", error);
    throw error;
  }
}

export async function getPostAction(slug: string): Promise<Post | null> {
  try {
    const path = `${POSTS_PATH}/${slug}.md`;
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
    console.error("Error getting post:", error);
    return null;
  }
}

export async function createPostAction(input: unknown): Promise<Post> {
  const validatedInput = CreatePostSchema.parse(input);
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
  const path = `${POSTS_PATH}/${validatedInput.slug}.md`;

  const sha = await updateGitHubFile(
    path,
    fileContent,
    `Create post: ${validatedInput.title}`,
  );

  return createPostObject(
    validatedInput.slug,
    {
      ...validatedInput,
      published: validatedInput.published ?? false,
      createdAt: now,
      updatedAt: now,
    } as PostFrontmatter,
    cleanContent,
    sha,
  );
}

export async function updatePostAction(
  slug: string,
  input: unknown,
): Promise<Post> {
  const validatedInput = UpdatePostSchema.parse(input);
  const existingPost = await getPostAction(slug);
  if (!existingPost) {
    throw new Error("Post not found");
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
  const path = `${POSTS_PATH}/${slug}.md`;

  const sha = await updateGitHubFile(
    path,
    fileContent,
    `Update post: ${validatedInput.title ?? existingPost.title}`,
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

export async function deletePostAction(
  slug: string,
  sha: string,
): Promise<void> {
  const path = `${POSTS_PATH}/${slug}.md`;

  await octokit.repos.deleteFile({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Delete post: ${slug}`,
    sha,
  });
  updateTag("posts");
}

export async function unpublishPostAction(
  slug: string,
  sha: string,
): Promise<Post> {
  const existingPost = await getPostAction(slug);
  if (!existingPost) {
    throw new Error("Post not found");
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
  const path = `${POSTS_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Unpublish post: ${existingPost.title}`,
    sha,
  );

  return {
    ...existingPost,
    published: false,
    updatedAt: now,
    sha: updatedSha,
  };
}

export async function publishPostAction(
  slug: string,
  sha: string,
): Promise<Post> {
  const existingPost = await getPostAction(slug);
  if (!existingPost) {
    throw new Error("Post not found");
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
  const path = `${POSTS_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Publish post: ${existingPost.title}`,
    sha,
  );

  return {
    ...existingPost,
    published: true,
    updatedAt: now,
    sha: updatedSha,
  };
}

export async function updatePostMetadataAction(
  slug: string,
  metadata: {
    createdAt?: string;
    publishedDate?: string;
  },
): Promise<Post> {
  const existingPost = await getPostAction(slug);
  if (!existingPost) {
    throw new Error("Post not found");
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
  const path = `${POSTS_PATH}/${slug}.md`;

  const updatedSha = await updateGitHubFile(
    path,
    fileContent,
    `Update post metadata: ${existingPost.title}`,
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
