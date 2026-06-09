export function isExternalImageSource(src: string) {
	return (
		src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:") ||
		src.startsWith("blob:")
	);
}

export function normalizeMediaSource(src: string) {
	const value = src.trim();

	if (!value) {
		return "";
	}

	try {
		if (value.startsWith("http://") || value.startsWith("https://")) {
			const url = new URL(value);

			if (url.hostname === "github.com") {
				const githubPath = normalizeGitHubMediaPath(url.pathname);
				if (githubPath) {
					return githubPath;
				}
			}

			if (url.hostname === "raw.githubusercontent.com") {
				const rawPath = normalizeRawGitHubMediaPath(url.pathname);
				if (rawPath) {
					return rawPath;
				}
			}

			if (url.pathname === "/api/image") {
				const legacyPath = url.searchParams.get("path")?.trim() ?? "";
				return legacyPath.replace(/^\/+/, "");
			}

			const legacyProxyPrefix = "/api/image/";
			if (url.pathname.startsWith(legacyProxyPrefix)) {
				const token = url.pathname.slice(legacyProxyPrefix.length);
				return decodeBase64Url(token);
			}

			return url.pathname.replace(/^\/+/, "");
		}
	} catch {
		return value.replace(/^\/+/, "");
	}

	if (value.startsWith("/api/image/")) {
		return decodeBase64Url(value.slice("/api/image/".length));
	}

	return value.replace(/^\/+/, "");
}

function normalizeGitHubMediaPath(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);
	const blobIndex = parts.indexOf("blob");

	if (blobIndex >= 0 && blobIndex + 2 < parts.length) {
		return parts.slice(blobIndex + 2).join("/");
	}

	const rawIndex = parts.indexOf("raw");
	if (rawIndex >= 0 && rawIndex + 2 < parts.length) {
		return parts.slice(rawIndex + 2).join("/");
	}

	return "";
}

function normalizeRawGitHubMediaPath(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);
	if (parts.length <= 4) {
		return "";
	}

	return parts.slice(4).join("/");
}

function decodeBase64Url(token: string) {
	const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

	try {
		const binary = atob(padded);
		return decodeURIComponent(
			Array.from(binary)
				.map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
				.join(""),
		).replace(/^\/+/, "");
	} catch {
		return token.replace(/^\/+/, "");
	}
}

export function extractMarkdownImageSources(markdown: string) {
	const sources = new Set<string>();
	const regex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

	for (const match of markdown.matchAll(regex)) {
		const value = match[1]?.trim();
		if (value) {
			sources.add(value);
		}
	}

	return Array.from(sources);
}

export function collectImageSources(values: Array<string | undefined | null>) {
	return Array.from(
		new Set(
			values
				.map((value) => value?.trim())
				.filter((value): value is string => Boolean(value)),
		),
	);
}
