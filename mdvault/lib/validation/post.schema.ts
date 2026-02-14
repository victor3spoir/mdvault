import { z } from "zod";
import { sanitizeText, sanitizeEmail, isValidUrl, sanitizeTags } from "@/lib/sanitize";

/**
 * Strict validation schemas for posts
 */

// Reusable validators with strong security constraints
const titleValidator = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be less than 200 characters")
  .refine(
    (val) => !/^[123456789.]*$/.test(val),
    "Title cannot be only numbers and dots"
  )
  .transform((val) => sanitizeText(val));

const contentValidator = z
  .string()
  .min(1, "Content is required")
  .max(500000, "Content is too large (max 500KB)")
  .refine(
    (val) => val.trim().length > 0,
    "Content cannot be empty or only whitespace"
  );

const coverImageValidator = z
  .string()
  .url("Cover image must be a valid URL")
  .refine(
    (val) => isValidUrl(val),
    "Cover image URL is not secure (must be https)"
  )
  .optional();

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

const articleValidator = z.string().optional();

/**
 * Create post schema with strict validation
 */
export const CreatePostSchema = z.object({
  title: titleValidator,
  content: contentValidator,
  lang: langValidator,
  author: authorValidator,
  coverImage: coverImageValidator,
  article: articleValidator,
  published: publishedValidator,
});

/**
 * Update post schema - all fields optional but still validated
 */
export const UpdatePostSchema = z.object({
  title: titleValidator.optional(),
  content: contentValidator.optional(),
  lang: langValidator.optional(),
  author: authorValidator,
  coverImage: coverImageValidator,
  article: articleValidator,
  published: publishedValidator.optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
