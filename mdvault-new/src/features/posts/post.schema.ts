import { z } from "zod";
import { isValidUrl, sanitizeText } from "#/lib/sanitize";

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

const authorValidator = z
	.string()
	.trim()
	.max(100, "Author name must be less than 100 characters")
	.optional()
	.transform((value) => (value ? sanitizeText(value) : undefined));

const langValidator = z.enum(["fr", "en"]).default("en");
const publishedValidator = z.boolean().default(false);

export const CreatePostSchema = z.object({
	title: titleValidator,
	content: contentValidator,
	lang: langValidator,
	author: authorValidator,
	coverImage: coverImageValidator,
	article: z.string().optional(),
	published: publishedValidator,
});

export const UpdatePostSchema = z.object({
	title: titleValidator.optional(),
	content: contentValidator.optional(),
	lang: langValidator.optional(),
	author: authorValidator,
	coverImage: coverImageValidator,
	article: z.string().optional(),
	published: publishedValidator.optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
