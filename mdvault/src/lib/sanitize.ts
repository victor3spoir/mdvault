/**
 * Keeps metadata plain and predictable. This is not an XSS defence: the
 * markdown renderer never emits raw HTML and React refuses `javascript:` URLs.
 */

/**
 * Collapses a value to a single line of plain text: markup is dropped, control
 * characters and line breaks are removed so the value cannot restructure the
 * YAML frontmatter it is stored in.
 */
export function sanitizeText(text: string): string {
	if (typeof text !== "string") {
		return "";
	}

	return (
		text
			.replace(/<[^>]*>/g, "")
			// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the intent
			.replace(/[\u0000-\u001f\u007f]+/g, " ")
			.replace(/\s+/g, " ")
			.trim()
	);
}

export function isValidUrl(url: string): boolean {
	if (typeof url !== "string" || !url) {
		return false;
	}

	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function sanitizeTag(tag: string): string {
	if (typeof tag !== "string" || !tag) {
		return "";
	}

	return tag
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\-_]/g, "")
		.slice(0, 50);
}

export function sanitizeTags(tags: unknown[]): string[] {
	if (!Array.isArray(tags)) {
		return [];
	}

	return tags
		.filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
		.map(sanitizeTag)
		.filter(Boolean);
}
