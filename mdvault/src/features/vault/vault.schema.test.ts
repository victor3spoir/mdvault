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
});
