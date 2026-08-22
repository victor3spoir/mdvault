import { z } from "zod";
import {
	DEFAULT_CONTENT_LOCALE,
	DEFAULT_CONTENT_LOCALES,
	LocaleSchema,
} from "#/features/shared/locales";
import { ASSET_ICONS } from "#/features/vault/vault.types";
import { isValidUrl, sanitizeTags, sanitizeText } from "#/lib/sanitize";

const RESERVED_TYPE_IDS = new Set([
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

export const VaultConfigSchema = z
	.object({
		version: z.number().int().min(1).default(1),
		assetTypes: z
			.array(AssetTypeConfigSchema)
			.max(20, "Maximum 20 asset types")
			.default([])
			.refine(
				(types) => new Set(types.map((type) => type.id)).size === types.length,
				"Asset type ids must be unique",
			),
		locales: z
			.array(LocaleSchema)
			.min(1, "Enable at least one locale")
			.max(20, "Maximum 20 locales")
			.default([...DEFAULT_CONTENT_LOCALES])
			.refine(
				(locales) => new Set(locales).size === locales.length,
				"Locales must be unique",
			),
		defaultLocale: LocaleSchema.optional(),
	})
	.transform((config) => ({
		...config,
		defaultLocale:
			config.defaultLocale ?? config.locales[0] ?? DEFAULT_CONTENT_LOCALE,
	}))
	.refine(
		(config) => config.locales.includes(config.defaultLocale),
		"Default locale must be enabled",
	);

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

const translationKeyValidator = z
	.string()
	.trim()
	.min(1, "Translation key cannot be empty")
	.max(64, "Translation key must be less than 64 characters")
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Translation key can only contain lowercase letters, numbers and hyphens",
	)
	.optional();

export const VaultAssetFrontmatterSchema = z.object({
	type: z.string().trim().min(1),
	title: z.string().trim().min(1).default("Untitled"),
	description: z.string().optional(),
	published: z.boolean().default(false),
	lang: LocaleSchema.default(DEFAULT_CONTENT_LOCALE),
	author: optionalFrontmatterText,
	tags: z.array(z.string()).optional(),
	coverImage: z.string().trim().min(1).optional(),
	createdAt: optionalFrontmatterText,
	updatedAt: optionalFrontmatterText,
	publishedDate: optionalFrontmatterText,
	translationKey: translationKeyValidator,
});

export const CreateVaultAssetSchema = z.object({
	type: AssetTypeIdSchema,
	title: titleValidator,
	description: descriptionValidator,
	content: contentValidator,
	lang: LocaleSchema.default(DEFAULT_CONTENT_LOCALE),
	coverImage: coverImageValidator,
	tags: tagsValidator,
	author: authorValidator,
	published: z.boolean().default(false),
	translationKey: translationKeyValidator,
});

export const UpdateVaultAssetSchema = z.object({
	title: titleValidator.optional(),
	description: descriptionValidator,
	content: contentValidator.optional(),
	lang: LocaleSchema.optional(),
	coverImage: coverImageValidator,
	tags: tagsValidator.optional(),
	author: authorValidator,
	published: z.boolean().optional(),
	translationKey: translationKeyValidator,
});

export type CreateVaultAssetInput = z.infer<typeof CreateVaultAssetSchema>;
export type UpdateVaultAssetInput = z.infer<typeof UpdateVaultAssetSchema>;
