import type { ContentLocaleConfig } from "#/features/shared/locales";
import {
	DEFAULT_CONTENT_LOCALE,
	DEFAULT_CONTENT_LOCALES,
} from "#/features/shared/locales";
import type { ActionResult } from "#/features/shared/shared.types";
import { VaultConfigSchema } from "#/features/vault/vault.schema";
import {
	type AssetTypeConfig,
	VAULT_CONFIG_PATH,
	VAULT_ROOT,
	type VaultConfig,
	type VaultConfigFile,
} from "#/features/vault/vault.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import {
	createContentErrorMessage,
	isGitHubNotFoundError,
} from "#/lib/server/content-errors.server";
import { base64ToUtf8, utf8ToBase64 } from "#/lib/server/github-files.server";
import { logger } from "#/lib/server/logger";

const EMPTY_CONFIG: VaultConfig = {
	version: 1,
	assetTypes: [],
	locales: [...DEFAULT_CONTENT_LOCALES],
	defaultLocale: DEFAULT_CONTENT_LOCALE,
};

export async function readVaultConfig(): Promise<
	ActionResult<VaultConfigFile>
> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();

		try {
			const response = await octokit.repos.getContent({
				owner: env.GITHUB_OWNER,
				repo: env.GITHUB_REPO,
				path: VAULT_CONFIG_PATH,
			});

			if (Array.isArray(response.data) || response.data.type !== "file") {
				return {
					success: true,
					data: { config: EMPTY_CONFIG, sha: null },
				};
			}

			const parsed = VaultConfigSchema.safeParse(
				JSON.parse(base64ToUtf8(response.data.content)),
			);

			if (!parsed.success) {
				logger.error("Invalid vault config file", parsed.error);
				return {
					success: true,
					data: { config: EMPTY_CONFIG, sha: response.data.sha },
				};
			}

			return {
				success: true,
				data: { config: parsed.data, sha: response.data.sha },
			};
		} catch (error) {
			if (isGitHubNotFoundError(error)) {
				return { success: true, data: { config: EMPTY_CONFIG, sha: null } };
			}
			throw error;
		}
	} catch (error) {
		logger.error("Failed to read vault config", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Vault config"),
		};
	}
}

async function writeVaultConfig(
	config: VaultConfig,
	message: string,
	sha: string | null,
) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	await octokit.repos.createOrUpdateFileContents({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		path: VAULT_CONFIG_PATH,
		message,
		content: utf8ToBase64(`${JSON.stringify(config, null, 2)}\n`),
		...(sha ? { sha } : {}),
	});
}

/**
 * Creates the folder backing a type. This is derived state: it is safe to run
 * repeatedly, and safe to run after the config has already been written.
 */
async function ensureTypeFolder(typeId: string) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const path = `${VAULT_ROOT}/${typeId}/.gitkeep`;

	try {
		await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
		});
	} catch (error) {
		if (!isGitHubNotFoundError(error)) {
			throw error;
		}
		await octokit.repos.createOrUpdateFileContents({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path,
			message: `Create vault folder: ${typeId}`,
			content: utf8ToBase64(""),
		});
	}
}

export async function addAssetType(
	type: AssetTypeConfig,
): Promise<ActionResult<VaultConfig>> {
	try {
		const current = await readVaultConfig();
		if (!current.success) {
			return current;
		}

		const { config, sha } = current.data;
		if (config.assetTypes.some((existing) => existing.id === type.id)) {
			return {
				success: false,
				error: `Asset type "${type.id}" already exists`,
			};
		}

		const next: VaultConfig = {
			...config,
			assetTypes: [...config.assetTypes, type],
		};
		VaultConfigSchema.parse(next);

		// Config first: it is the source of truth and revision guarded. A failure
		// after it leaves a type without a folder, which the next write repairs.
		await writeVaultConfig(next, `Add asset type: ${type.id}`, sha);
		await ensureTypeFolder(type.id);

		return { success: true, data: next };
	} catch (error) {
		logger.error("Failed to add asset type", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Vault config"),
		};
	}
}

export async function updateAssetType(
	typeId: string,
	updates: Pick<AssetTypeConfig, "label" | "icon" | "editor">,
): Promise<ActionResult<VaultConfig>> {
	try {
		const current = await readVaultConfig();
		if (!current.success) {
			return current;
		}

		const { config, sha } = current.data;
		const index = config.assetTypes.findIndex((type) => type.id === typeId);
		if (index === -1) {
			return { success: false, error: `Asset type "${typeId}" not found` };
		}

		const nextTypes = [...config.assetTypes];
		nextTypes[index] = { ...nextTypes[index], ...updates, id: typeId };
		const next: VaultConfig = { ...config, assetTypes: nextTypes };
		VaultConfigSchema.parse(next);

		await writeVaultConfig(next, `Update asset type: ${typeId}`, sha);

		return { success: true, data: next };
	} catch (error) {
		logger.error("Failed to update asset type", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Vault config"),
		};
	}
}

export async function removeAssetType(
	typeId: string,
): Promise<ActionResult<VaultConfig>> {
	try {
		const current = await readVaultConfig();
		if (!current.success) {
			return current;
		}

		const { config, sha } = current.data;
		if (!config.assetTypes.some((type) => type.id === typeId)) {
			return { success: false, error: `Asset type "${typeId}" not found` };
		}

		const next: VaultConfig = {
			...config,
			assetTypes: config.assetTypes.filter((type) => type.id !== typeId),
		};

		await writeVaultConfig(next, `Remove asset type: ${typeId}`, sha);

		return { success: true, data: next };
	} catch (error) {
		logger.error("Failed to remove asset type", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Vault config"),
		};
	}
}

export async function updateContentLocales(
	locales: ContentLocaleConfig,
): Promise<ActionResult<VaultConfig>> {
	try {
		const current = await readVaultConfig();
		if (!current.success) {
			return current;
		}

		const { config, sha } = current.data;
		const next = VaultConfigSchema.parse({ ...config, ...locales });

		await writeVaultConfig(next, "Update content languages", sha);

		return { success: true, data: next };
	} catch (error) {
		logger.error("Failed to update content languages", error);
		return {
			success: false,
			error: createContentErrorMessage(error, "Vault config"),
		};
	}
}
