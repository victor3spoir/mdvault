import { z } from "zod";
import { isValidUrl, sanitizeTags, sanitizeText } from "@/lib/sanitize";

/**
 * Strict validation schemas for articles
 */

// Reusable validators with strong security constraints
const titleValidator = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be less than 200 characters")
  .refine(
    (val) => !/^[123456789.]*$/.test(val),
    "Title cannot be only numbers and dots",
  )
  .transform((val) => sanitizeText(val));

const descriptionValidator = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(500, "Description must be less than 500 characters")
  .refine((val) => val.length >= 3, "Description must be at least 3 characters")
  .transform((val) => sanitizeText(val));

const contentValidator = z
  .string()
  .min(1, "Content is required")
  .max(500000, "Content is too large (max 500KB)")
  .refine(
    (val) => val.trim().length > 0,
    "Content cannot be empty or only whitespace",
  );

// Cover image accepts either:
// - a repo-relative path (e.g. "media/abc123.jpg") for private/public repo-stored images
// - a legacy full https:// URL (old content migrated before the repo-storage model)
const coverImageValidator = z
  .string()
  .refine((val) => {
    // Repo-relative path: must not start with http/data/javascript and must contain a dot (extension)
    const isRepoPath =
      !val.startsWith("http") && !val.startsWith("data:") && val.includes(".");
    const isHttpsUrl = isValidUrl(val);
    return isRepoPath || isHttpsUrl;
  }, "Cover image must be a repo-relative path (e.g. media/image.jpg) or a valid https URL")
  .optional();

const tagsValidator = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Tag cannot be empty")
      .max(50, "Tag must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9\-_]+$/,
        "Tags can only contain letters, numbers, hyphens, and underscores",
      ),
  )
  .max(10, "Maximum 10 tags allowed")
  .default([])
  .transform((val) => sanitizeTags(val));

const authorValidator = z
  .string()
  .trim()
  .max(100, "Author name must be less than 100 characters")
  .optional()
  .transform((val) => (val ? sanitizeText(val) : undefined));

const langValidator = z
  .enum(["fr", "en"], { message: "Language must be 'fr' or 'en'" })
  .default("en");

const publishedValidator = z.boolean().default(false);

/**
 * Create article schema with strict validation
 */
export const CreateArticleSchema = z.object({
  title: titleValidator,
  description: descriptionValidator,
  content: contentValidator,
  lang: langValidator,
  coverImage: coverImageValidator,
  tags: tagsValidator,
  author: authorValidator,
  published: publishedValidator,
});

/**
 * Update article schema - all fields optional but still validated
 */
export const UpdateArticleSchema = z.object({
  title: titleValidator.optional(),
  description: descriptionValidator.optional(),
  content: contentValidator.optional(),
  lang: langValidator.optional(),
  coverImage: coverImageValidator,
  tags: tagsValidator.optional(),
  author: authorValidator,
  published: publishedValidator.optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
