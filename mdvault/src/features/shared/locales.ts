import { z } from "zod";

export const DEFAULT_CONTENT_LOCALES = ["en", "fr"] as const;
export const DEFAULT_CONTENT_LOCALE = "en";

const BCP_47_STYLE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

function canonicalizeLocale(value: string) {
	try {
		return Intl.getCanonicalLocales(value)[0] ?? null;
	} catch {
		return null;
	}
}

export const LocaleSchema = z
	.string()
	.trim()
	.min(2, "Locale must be at least 2 characters")
	.max(35, "Locale must be less than 35 characters")
	.regex(BCP_47_STYLE_PATTERN, "Use a locale such as en, fr, pt-BR, or zh-Hant")
	.refine(
		(value) => canonicalizeLocale(value) !== null,
		"Use a valid BCP 47 locale",
	)
	.transform((value) => canonicalizeLocale(value) as string);

export const ContentLocaleConfigSchema = z
	.object({
		locales: z
			.array(LocaleSchema)
			.min(1, "Enable at least one locale")
			.max(20, "Maximum 20 locales")
			.refine(
				(locales) => new Set(locales).size === locales.length,
				"Locales must be unique",
			),
		defaultLocale: LocaleSchema,
	})
	.refine(
		(config) => config.locales.includes(config.defaultLocale),
		"Default locale must be enabled",
	);

export type ContentLocaleConfig = z.infer<typeof ContentLocaleConfigSchema>;

const localeDisplayNames = new Intl.DisplayNames(["en"], {
	type: "language",
});

export function getLocaleLabel(locale: string) {
	try {
		return localeDisplayNames.of(locale) ?? locale;
	} catch {
		return locale;
	}
}

export function getLocaleBadge(locale: string) {
	return locale.toUpperCase();
}

/**
 * Resolve the flag-bearing region for a locale ("fr" -> "FR", "pt-BR" -> "BR").
 * Returns null when the locale maximizes to a non-country region such as "001".
 */
export function getLocaleRegion(locale: string) {
	try {
		const region = new Intl.Locale(locale).maximize().region;

		if (!region || !/^[A-Z]{2}$/.test(region)) {
			return null;
		}

		return region;
	} catch {
		return null;
	}
}

export function includeCurrentLocale(
	locales: readonly string[],
	currentLocale?: string,
) {
	if (!currentLocale || locales.includes(currentLocale)) {
		return [...locales];
	}

	return [...locales, currentLocale];
}
