import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ContentRevisionSchema } from "#/features/shared/content-revision";
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
	updateAsset,
} from "#/features/vault/vault.server";
import {
	addAssetType,
	readVaultConfig,
	removeAssetType,
	updateAssetType,
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
