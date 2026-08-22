import {
	type ContentKind,
	createContentStore,
	InvalidContentError,
} from "#/features/content/content-store.server";
import type {
	ContentMutationResult,
	ContentRevision,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import {
	type CreateVaultAssetInput,
	CreateVaultAssetSchema,
	type UpdateVaultAssetInput,
	UpdateVaultAssetSchema,
	VaultAssetFrontmatterSchema,
} from "#/features/vault/vault.schema";
import { VAULT_ROOT, type VaultAsset } from "#/features/vault/vault.types";

type CreateAssetFields = Omit<CreateVaultAssetInput, "type">;

/**
 * Vault assets are the same content model as articles, parameterised by the
 * user defined type that decides which folder they live in.
 */
function vaultKind(type: string): ContentKind<VaultAsset, CreateAssetFields> {
	return {
		label: "Asset",
		commitNoun: type,
		root: () => `${VAULT_ROOT}/${type}`,

		toDocument({ id, data, body, path, sha }) {
			const parsed = VaultAssetFrontmatterSchema.safeParse(data);

			if (!parsed.success) {
				throw new InvalidContentError(
					"Asset",
					parsed.error.issues.map((issue) => issue.message).join(", "),
				);
			}

			const frontmatter = parsed.data;
			const now = new Date().toISOString();

			return {
				id,
				type: frontmatter.type,
				title: frontmatter.title,
				description: frontmatter.description,
				content: body,
				lang: frontmatter.lang,
				createdAt: frontmatter.createdAt || now,
				updatedAt: frontmatter.updatedAt || now,
				publishedAt: frontmatter.publishedDate,
				published: frontmatter.published,
				author: frontmatter.author,
				tags: frontmatter.tags,
				coverImage: frontmatter.coverImage,
				translationKey: frontmatter.translationKey,
				path,
				sha,
			};
		},

		toFrontmatter(asset) {
			return {
				type: asset.type,
				title: asset.title,
				description: asset.description,
				published: asset.published,
				lang: asset.lang,
				tags: asset.tags,
				coverImage: asset.coverImage,
				author: asset.author,
				createdAt: asset.createdAt,
				updatedAt: asset.updatedAt,
				publishedDate: asset.publishedAt,
				translationKey: asset.translationKey,
			};
		},

		toNewDocument({ id, input, body, now, author }) {
			return {
				id,
				type,
				title: input.title,
				description: input.description,
				content: body,
				lang: input.lang,
				createdAt: now,
				updatedAt: now,
				publishedAt: input.published ? now : undefined,
				published: input.published,
				author: input.author || author,
				tags: input.tags,
				coverImage: input.coverImage,
				translationKey: input.translationKey,
				path: "",
				sha: "",
			};
		},
	};
}

const storeCache = new Map<
	string,
	ReturnType<typeof createContentStore<VaultAsset, CreateAssetFields>>
>();

function storeFor(type: string) {
	const cached = storeCache.get(type);
	if (cached) {
		return cached;
	}

	const store = createContentStore(vaultKind(type));
	storeCache.set(type, store);
	return store;
}

export async function listAssets(
	type: string,
): Promise<ActionResult<VaultAsset[]>> {
	return storeFor(type).list();
}

export async function getAsset(
	type: string,
	id: string,
	path?: string,
): Promise<ActionResult<VaultAsset>> {
	return storeFor(type).get(id, path);
}

export async function createAsset(
	input: CreateVaultAssetInput,
): Promise<ActionResult<string>> {
	const { type, ...fields } = CreateVaultAssetSchema.parse(input);
	return storeFor(type).create(fields);
}

export async function updateAsset(
	type: string,
	id: string,
	input: UpdateVaultAssetInput,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return storeFor(type).update(
		id,
		UpdateVaultAssetSchema.parse(input),
		revision,
	);
}

export async function setAssetTranslationKey(
	type: string,
	id: string,
	translationKey: string | undefined,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return storeFor(type).update(id, { translationKey }, revision);
}

export async function deleteAsset(
	type: string,
	id: string,
	revision: ContentRevision,
): Promise<ActionResult<boolean>> {
	return storeFor(type).remove(id, revision);
}

export async function setAssetPublished(
	type: string,
	id: string,
	published: boolean,
	revision: ContentRevision,
): Promise<ActionResult<ContentMutationResult>> {
	return storeFor(type).setPublished(id, published, revision);
}
