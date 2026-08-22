import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	createTranslationKey,
	findLinkCandidates,
	findTranslations,
	getTranslationLinkError,
} from "#/features/shared/article-translations";
import { ContentRevisionSchema } from "#/features/shared/content-revision";
import { ContentLocaleConfigSchema } from "#/features/shared/locales";
import {
	AssetTypeConfigSchema,
	AssetTypeIdSchema,
	CreateVaultAssetSchema,
	UpdateVaultAssetSchema,
} from "#/features/vault/vault.schema";
import {
	createAsset,
	deleteAsset,
	getAsset,
	listAssets,
	setAssetPublished,
	setAssetTranslationKey,
	updateAsset,
} from "#/features/vault/vault.server";
import type { VaultAsset } from "#/features/vault/vault.types";
import {
	addAssetType,
	readVaultConfig,
	removeAssetType,
	updateAssetType,
	updateContentLocales,
} from "#/features/vault/vault-config.server";
import { securityMiddleware } from "#/lib/security-middleware";

export const getVaultConfig = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.handler(async () => {
		const result = await readVaultConfig();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data.config;
	});

export const addAssetTypeMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => AssetTypeConfigSchema.parse(data))
	.handler(async ({ data }) => {
		const result = await addAssetType(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateAssetTypeMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				id: AssetTypeIdSchema,
				updates: AssetTypeConfigSchema.omit({ id: true }),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await updateAssetType(data.id, data.updates);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const removeAssetTypeMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => z.object({ id: AssetTypeIdSchema }).parse(data))
	.handler(async ({ data }) => {
		const result = await removeAssetType(data.id);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateContentLocalesMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => ContentLocaleConfigSchema.parse(data))
	.handler(async ({ data }) => {
		const result = await updateContentLocales(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getVaultAssets = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) => z.object({ type: AssetTypeIdSchema }).parse(data))
	.handler(async ({ data }) => {
		const result = await listAssets(data.type);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getVaultAssetById = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z.object({ type: AssetTypeIdSchema, id: z.string().min(1) }).parse(data),
	)
	.handler(async ({ data }) => {
		const result = await getAsset(data.type, data.id);

		if (result.success) {
			return result.data;
		}
		if (result.error.includes("not found")) {
			return null;
		}
		throw new Error(result.error);
	});

export const getVaultAssetTranslations = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z.object({ type: AssetTypeIdSchema, id: z.string().min(1) }).parse(data),
	)
	.handler(async ({ data }) => {
		const result = await listAssets(data.type);

		if (!result.success) {
			throw new Error(result.error);
		}

		const asset = result.data.find((candidate) => candidate.id === data.id);
		if (!asset) {
			return { translations: [], candidates: [] };
		}

		return {
			translations: findTranslations(result.data, asset).map(toAssetSummary),
			candidates: findLinkCandidates(result.data, asset).map(toAssetSummary),
		};
	});

function toAssetSummary(asset: VaultAsset) {
	return {
		id: asset.id,
		title: asset.title,
		lang: asset.lang,
		published: asset.published,
		translationKey: asset.translationKey,
	};
}

export const linkVaultAssetTranslationMutation = createServerFn({
	method: "POST",
})
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				type: AssetTypeIdSchema,
				id: z.string().min(1),
				targetId: z.string().min(1),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const listed = await listAssets(data.type);

		if (!listed.success) {
			throw new Error(listed.error);
		}

		const source = listed.data.find((asset) => asset.id === data.id);
		const target = listed.data.find((asset) => asset.id === data.targetId);

		if (!source || !target) {
			throw new Error("Vault asset not found");
		}

		const linkError = getTranslationLinkError(listed.data, source, target);
		if (linkError) {
			throw new Error(linkError);
		}

		const translationKey =
			source.translationKey ??
			target.translationKey ??
			createTranslationKey(source.title);

		if (target.translationKey !== translationKey) {
			const written = await setAssetTranslationKey(
				data.type,
				target.id,
				translationKey,
				{ path: target.path, sha: target.sha },
			);

			if (!written.success) {
				throw new Error(written.error);
			}
		}

		if (source.translationKey !== translationKey) {
			const written = await setAssetTranslationKey(
				data.type,
				source.id,
				translationKey,
				{ path: source.path, sha: source.sha },
			);

			if (!written.success) {
				throw new Error(written.error);
			}

			return { translationKey, revision: written.data };
		}

		return {
			translationKey,
			revision: { id: source.id, path: source.path, sha: source.sha },
		};
	});

export const unlinkVaultAssetTranslationMutation = createServerFn({
	method: "POST",
})
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				type: AssetTypeIdSchema,
				id: z.string().min(1),
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await setAssetTranslationKey(
			data.type,
			data.id,
			undefined,
			data.revision,
		);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const createVaultAssetMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) => CreateVaultAssetSchema.parse(data))
	.handler(async ({ data }) => {
		const result = await createAsset(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateVaultAssetMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				type: AssetTypeIdSchema,
				id: z.string().min(1),
				input: UpdateVaultAssetSchema,
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await updateAsset(
			data.type,
			data.id,
			data.input,
			data.revision,
		);

		if (!result.success) {
			throw new Error(result.error);
		}

		return { path: result.data.path, sha: result.data.sha };
	});

export const deleteVaultAssetMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				type: AssetTypeIdSchema,
				id: z.string().min(1),
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await deleteAsset(data.type, data.id, data.revision);

		if (!result.success) {
			throw new Error(result.error);
		}

		return true;
	});

export const setVaultAssetPublishedMutation = createServerFn({
	method: "POST",
})
	.middleware([securityMiddleware])
	.validator((data) =>
		z
			.object({
				type: AssetTypeIdSchema,
				id: z.string().min(1),
				published: z.boolean(),
				revision: ContentRevisionSchema,
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await setAssetPublished(
			data.type,
			data.id,
			data.published,
			data.revision,
		);

		if (!result.success) {
			throw new Error(result.error);
		}

		return { path: result.data.path, sha: result.data.sha };
	});
