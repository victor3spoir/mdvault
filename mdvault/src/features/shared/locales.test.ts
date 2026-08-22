import { describe, expect, it } from "vitest";
import {
	ContentLocaleConfigSchema,
	getLocaleRegion,
	includeCurrentLocale,
	LocaleSchema,
} from "#/features/shared/locales";

describe("LocaleSchema", () => {
	it.each([
		["en", "en"],
		["FR", "fr"],
		["pt-br", "pt-BR"],
		["zh-hant", "zh-Hant"],
	])("accepts and canonicalizes %s", (input, expected) => {
		expect(LocaleSchema.parse(input)).toBe(expected);
	});

	it.each([
		"e",
		"english",
		"en_US",
		"en--US",
		"123",
	])("rejects malformed locale %s", (locale) => {
		expect(() => LocaleSchema.parse(locale)).toThrow();
	});
});

describe("ContentLocaleConfigSchema", () => {
	it("requires the default locale to be enabled", () => {
		expect(() =>
			ContentLocaleConfigSchema.parse({
				locales: ["en", "fr"],
				defaultLocale: "de",
			}),
		).toThrow();
	});

	it("rejects canonical duplicates", () => {
		expect(() =>
			ContentLocaleConfigSchema.parse({
				locales: ["pt-BR", "pt-br"],
				defaultLocale: "pt-BR",
			}),
		).toThrow();
	});
});

describe("includeCurrentLocale", () => {
	it("keeps an existing document locale available after it is disabled", () => {
		expect(includeCurrentLocale(["en", "fr"], "de")).toEqual([
			"en",
			"fr",
			"de",
		]);
	});
});

describe("getLocaleRegion", () => {
	it.each([
		["en", "US"],
		["fr", "FR"],
		["pt-BR", "BR"],
		["zh-Hant", "TW"],
		["fr-CA", "CA"],
	])("resolves %s to %s", (locale, expected) => {
		expect(getLocaleRegion(locale)).toBe(expected);
	});

	it.each([
		"eo",
		"en_US",
		"",
	])("returns null when %s has no country", (locale) => {
		expect(getLocaleRegion(locale)).toBeNull();
	});
});
