import { z } from "zod";
import { ASSET_ICONS } from "#/features/vault/vault.types";
import { isValidUrl, sanitizeTags, sanitizeText } from "#/lib/sanitize";

export const RESERVED_TYPE_IDS = new Set([
	"articles",
	"posts",
	"media",
	"settings",
	"vault",
	"new",
	"edit",
	"cms",
]);

export const AssetTypeIdSchema = z
	.string()
	.trim()
	.min(2, "Type id must be at least 2 characters")
	.max(30, "Type id must be less than 30 characters")
	.regex(
		/^[a-z][a-z0-9-]*$/,
		"Type id must start with a letter and contain only lowercase letters, numbers, and hyphens",
	)
	.refine((value) => !RESERVED_TYPE_IDS.has(value), "This type id is reserved");

export const AssetTypeConfigSchema = z.object({
	id: AssetTypeIdSchema,
	label: z
		.string()
		.trim()
		.min(1, "Label is required")
		.max(40, "Label must be less than 40 characters")
		.transform((value) => sanitizeText(value)),
	icon: z.enum(ASSET_ICONS).default("note"),
	editor: z.enum(["rich", "plain"]).default("rich"),
});

export const VaultConfigSchema = z.object({
	version: z.number().int().min(1).default(1),
	assetTypes: z
		.array(AssetTypeConfigSchema)
		.max(20, "Maximum 20 asset types")
		.default([])
		.refine(
			(types) => new Set(types.map((type) => type.id)).size === types.length,
			"Asset type ids must be unique",
		),
});

const titleValidator = z
	.string()
	.trim()
	.min(1, "Title is required")
	.max(200, "Title must be less than 200 characters")
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
			.min(1)
			.max(50)
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
	.max(100)
	.optional()
	.transform((value) => (value ? sanitizeText(value) : undefined));

const descriptionValidator = z
	.string()
	.trim()
	.max(500, "Description must be less than 500 characters")
	.optional()
	.transform((value) => (value ? sanitizeText(value) : undefined));

const optionalFrontmatterText = z.string().trim().min(1).optional();

export const VaultAssetFrontmatterSchema = z.object({
	type: z.string().trim().min(1),
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

export const CreateVaultAssetSchema = z.object({
	type: AssetTypeIdSchema,
	title: titleValidator,
	description: descriptionValidator,
	content: contentValidator,
	lang: z.enum(["fr", "en"]).default("en"),
	coverImage: coverImageValidator,
	tags: tagsValidator,
	author: authorValidator,
	published: z.boolean().default(false),
});

export const UpdateVaultAssetSchema = z.object({
	title: titleValidator.optional(),
	description: descriptionValidator,
	content: contentValidator.optional(),
	lang: z.enum(["fr", "en"]).optional(),
	coverImage: coverImageValidator,
	tags: tagsValidator.optional(),
	author: authorValidator,
	published: z.boolean().optional(),
});

export type CreateVaultAssetInput = z.infer<typeof CreateVaultAssetSchema>;
export type UpdateVaultAssetInput = z.infer<typeof UpdateVaultAssetSchema>;
