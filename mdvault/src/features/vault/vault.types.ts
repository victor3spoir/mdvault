export const VAULT_ROOT = "vault";
export const VAULT_CONFIG_PATH = "mdvault.config.json";

export const ASSET_ICONS = [
	"note",
	"book",
	"school",
	"bulb",
	"checklist",
	"bookmark",
	"folder",
	"flask",
	"code",
	"pencil",
	"star",
	"archive",
] as const;

export type AssetIcon = (typeof ASSET_ICONS)[number];

export type AssetEditor = "rich" | "plain";

export interface AssetTypeConfig {
	id: string;
	label: string;
	icon: AssetIcon;
	editor: AssetEditor;
}

export interface VaultConfig {
	version: number;
	assetTypes: AssetTypeConfig[];
}

export interface VaultConfigFile {
	config: VaultConfig;
	sha: string | null;
}

export interface VaultAsset {
	id: string;
	type: string;
	title: string;
	description?: string;
	content: string;
	lang: "fr" | "en";
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
	author?: string;
	tags?: string[];
	coverImage?: string;
	path: string;
	sha: string;
}
