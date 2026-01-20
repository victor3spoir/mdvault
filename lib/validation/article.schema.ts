import { z } from "zod";

/**
 * Article validation schemas
 */
export const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .max(100, "Slug must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim(),
  content: z.string().max(1000000, "Content is too large (max 1MB)"),
  coverImage: z.string().url("Cover image must be a valid URL").optional(),
  tags: z
    .array(z.string().max(50, "Tag must be less than 50 characters"))
    .max(10, "Maximum 10 tags allowed"),
  published: z.boolean().optional(),
  author: z.string().optional(),
});

export const UpdateArticleSchema = CreateArticleSchema.extend({
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .max(100, "Slug must be less than 100 characters"),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
