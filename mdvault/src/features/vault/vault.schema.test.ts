import { describe, expect, it } from "vitest";
import {
	AssetTypeConfigSchema,
	AssetTypeIdSchema,
	VaultAssetFrontmatterSchema,
	VaultConfigSchema,
} from "#/features/vault/vault.schema";

describe("AssetTypeIdSchema", () => {
	it("accepts valid slugs", () => {
		expect(AssetTypeIdSchema.parse("note")).toBe("note");
		expect(AssetTypeIdSchema.parse("dev-notes")).toBe("dev-notes");
		expect(AssetTypeIdSchema.parse("tuto2")).toBe("tuto2");
	});

	it("rejects reserved ids", () => {
		for (const reserved of [
			"articles",
			"posts",
			"media",
			"settings",
			"vault",
		]) {
			expect(() => AssetTypeIdSchema.parse(reserved)).toThrow();
		}
	});

	it("rejects invalid formats", () => {
		expect(() => AssetTypeIdSchema.parse("Note")).toThrow();
		expect(() => AssetTypeIdSchema.parse("2notes")).toThrow();
		expect(() => AssetTypeIdSchema.parse("my notes")).toThrow();
		expect(() => AssetTypeIdSchema.parse("a")).toThrow();
	});
});

describe("VaultConfigSchema", () => {
	it("parses a valid config", () => {
		const config = VaultConfigSchema.parse({
			version: 1,
			assetTypes: [
				{ id: "note", label: "Notes", icon: "note", editor: "plain" },
				{ id: "doc", label: "Docs", icon: "book", editor: "rich" },
			],
		});
		expect(config.assetTypes).toHaveLength(2);
		expect(config.locales).toEqual(["en", "fr"]);
		expect(config.defaultLocale).toBe("en");
	});

	it("keeps old config files compatible with locale defaults", () => {
		expect(
			VaultConfigSchema.parse({ version: 1, assetTypes: [] }),
		).toMatchObject({
			locales: ["en", "fr"],
			defaultLocale: "en",
		});
	});

	it("uses the first configured locale when an old config has no default", () => {
		expect(
			VaultConfigSchema.parse({
				version: 1,
				assetTypes: [],
				locales: ["de", "fr"],
			}).defaultLocale,
		).toBe("de");
	});

	it("requires the default locale to be enabled", () => {
		expect(() =>
			VaultConfigSchema.parse({
				version: 1,
				assetTypes: [],
				locales: ["en", "fr"],
				defaultLocale: "de",
			}),
		).toThrow();
	});

	it("rejects duplicate ids", () => {
		expect(() =>
			VaultConfigSchema.parse({
				version: 1,
				assetTypes: [
					{ id: "note", label: "A", icon: "note", editor: "plain" },
					{ id: "note", label: "B", icon: "book", editor: "rich" },
				],
			}),
		).toThrow();
	});

	it("defaults icon and editor", () => {
		const parsed = AssetTypeConfigSchema.parse({ id: "note", label: "Notes" });
		expect(parsed.icon).toBe("note");
		expect(parsed.editor).toBe("rich");
	});
});

describe("VaultAssetFrontmatterSchema", () => {
	it("requires the type field", () => {
		expect(() =>
			VaultAssetFrontmatterSchema.parse({ title: "Hi", published: false }),
		).toThrow();
	});

	it("parses complete frontmatter", () => {
		const parsed = VaultAssetFrontmatterSchema.parse({
			type: "note",
			title: "My note",
			published: true,
			lang: "fr",
			tags: ["dev"],
		});
		expect(parsed.type).toBe("note");
		expect(parsed.lang).toBe("fr");
	});

	it("keeps frontmatter without a translation key backward-compatible", () => {
		const parsed = VaultAssetFrontmatterSchema.parse({
			type: "note",
			title: "Legacy note",
			published: false,
			lang: "en",
		});

		expect(parsed.translationKey).toBeUndefined();
	});

	it("accepts a slug-safe translation key in frontmatter", () => {
		const parsed = VaultAssetFrontmatterSchema.parse({
			type: "note",
			title: "Translated note",
			published: false,
			lang: "fr",
			translationKey: "translated-note-a1b2c3",
		});

		expect(parsed.translationKey).toBe("translated-note-a1b2c3");
	});

	it("rejects a malformed translation key in frontmatter", () => {
		expect(() =>
			VaultAssetFrontmatterSchema.parse({
				type: "note",
				title: "Broken note",
				published: false,
				lang: "fr",
				translationKey: "Broken Note!",
			}),
		).toThrow();
	});
});
