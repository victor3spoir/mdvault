import matter from "gray-matter";
import { EDITOR_CONFIG } from "./articles.constants";
import type { ArticleFrontmatter } from "./articles.types";

export function generateFrontmatter(data: ArticleFrontmatter): string {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

  return matter.stringify("", cleanData).trim();
}

export function parseFrontmatter(content: string): {
  frontmatter: ArticleFrontmatter;
  body: string;
} {
  if (typeof content !== "string") {
    throw new Error("Content must be a string");
  }

  const { data, content: body } = matter(content);

  const frontmatter: ArticleFrontmatter = {
    title: data.title ?? "Untitled",
    description: data.description,
    published: data.published ?? false,
    author: data.author,
    coverImage: data.coverImage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedDate: data.publishedDate,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
  };

  return { frontmatter, body };
}

export function updateFrontmatter(
  content: string,
  updates: Partial<ArticleFrontmatter>,
): string {
  const { frontmatter, body } = parseFrontmatter(content);
  const updatedFrontmatter = { ...frontmatter, ...updates };
  const frontmatterString = generateFrontmatter(updatedFrontmatter);

  return `${frontmatterString}\n${body}`;
} /**
 * Calculate word count from text content
 */

export function calculateWordCount(content: string): number {
  if (!content || typeof content !== "string") {
    return 0;
  }
  return content.split(/\s+/).filter(Boolean).length;
}
/**
 * Calculate estimated reading time in minutes
 */

export function calculateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / EDITOR_CONFIG.WORDS_PER_MINUTE));
}/**
 * Get word count and read time from content
 */

export function getContentStats(content: string): {
  wordCount: number;
  readTime: number;
} {
  const wordCount = calculateWordCount(content);
  const readTime = calculateReadTime(wordCount);
  return { wordCount, readTime };
}

