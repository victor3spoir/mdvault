export function sanitizeText(text: string): string {
	if (!text || typeof text !== "string") {
		return "";
	}

	let sanitized = text.replace(/<[^>]*>/g, "");
	sanitized = sanitized
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

	sanitized = sanitized
		.replace(/javascript:/gi, "")
		.replace(/on\w+\s*=/gi, "")
		.replace(/eval\(/gi, "");

	return sanitized.trim();
}

export function isValidUrl(url: string): boolean {
	if (!url || typeof url !== "string") {
		return false;
	}

	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

export function sanitizeMarkdown(content: string): string {
	if (!content || typeof content !== "string") {
		return "";
	}

	let sanitized = content;
	sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, "");
	sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
	sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");
	sanitized = sanitized.replace(/data:text\/html/gi, "");
	sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gis, "");
	sanitized = sanitized.replace(
		/style\s*=\s*["'][^"']*javascript[^"']*["']/gi,
		"",
	);

	return sanitized;
}

export function sanitizeTag(tag: string): string {
	if (!tag || typeof tag !== "string") {
		return "";
	}

	return tag
		.replace(/<[^>]*>/g, "")
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
