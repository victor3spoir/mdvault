import { z } from "zod";
import { isValidUrl, sanitizeTags, sanitizeText } from "#/lib/sanitize";

const titleValidator = z
	.string()
	.trim()
	.min(1, "Title is required")
	.max(200, "Title must be less than 200 characters")
	.refine(
		(value) => !/^[123456789.]*$/.test(value),
		"Title cannot be only numbers and dots",
	)
	.transform((value) => sanitizeText(value));

const descriptionValidator = z
	.string()
	.trim()
	.min(1, "Description is required")
	.max(500, "Description must be less than 500 characters")
	.refine(
		(value) => value.length >= 3,
		"Description must be at least 3 characters",
	)
	.transform((value) => sanitizeText(value));

const contentValidator = z
	.string()
	.min(1, "Content is required")
	.max(500000, "Content is too large")
	.refine(
		(value) => value.trim().length > 0,
		"Content cannot be empty or whitespace only",
	);

const coverImageValidator = z
	.string()
	.refine((value) => {
		const isRepoPath =
			!value.startsWith("http") &&
			!value.startsWith("data:") &&
			value.includes(".");
		return isRepoPath || isValidUrl(value);
	}, "Cover image must be a repo path or a valid URL")
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
	.transform((value) => sanitizeTags(value));

const authorValidator = z
	.string()
	.trim()
	.max(100, "Author name must be less than 100 characters")
	.optional()
	.transform((value) => (value ? sanitizeText(value) : undefined));

const langValidator = z.enum(["fr", "en"]).default("en");
const publishedValidator = z.boolean().default(false);
const optionalFrontmatterText = z.string().trim().min(1).optional();

export const ArticleFrontmatterSchema = z.object({
	title: z.string().trim().min(1).default("Untitled"),
	description: z.string().optional(),
	published: z.boolean().default(false),
	lang: z.enum(["fr", "en"]).default("en"),
	author: optionalFrontmatterText,
	tags: z.array(z.string()).optional(),
	coverImage: z.string().trim().min(1).optional(),
	createdAt: optionalFrontmatterText,
	updatedAt: optionalFrontmatterText,
	publishedDate: optionalFrontmatterText,
});

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
