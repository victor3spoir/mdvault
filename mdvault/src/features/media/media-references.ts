import { parseMarkdown } from "@tanstack/markdown/parser";
import { MEDIA_EXTENSION } from "./media-path";

export interface MediaReferenceContext {
	mediaRoot: string;
	owner: string;
	repo: string;
	branch: string;
}

export interface MediaReference {
	path: string;
	from: number;
	to: number;
	value: string;
	suffix: string;
	documentPath: string;
}

function decode(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return null;
	}
}

function rootedPath(value: string, documentPath: string, root: string) {
	const decoded = decode(value.replace(/\\([ ()])/g, "$1"));
	if (!decoded || decoded.includes("\0") || decoded.includes("\\")) return null;
	let path = decoded.replace(/^\/+/, "");
	if (path.startsWith("./") || path.startsWith("../")) {
		const segments = documentPath.split("/").slice(0, -1);
		for (const part of path.split("/")) {
			if (part === "..") {
				if (!segments.length) return null;
				segments.pop();
			} else if (part && part !== ".") segments.push(part);
		}
		path = segments.join("/");
	}
	if (!path.includes("/")) path = `${root}/${path}`;
	return path.startsWith(`${root}/`) &&
		!path.split("/").some((part) => part === ".." || part === ".") &&
		MEDIA_EXTENSION.test(path)
		? path
		: null;
}

function resolveReference(
	value: string,
	documentPath: string,
	context: MediaReferenceContext,
) {
	let source = value.replace(/&amp;/g, "&");
	const hash = source.indexOf("#");
	const fragment = hash < 0 ? "" : source.slice(hash);
	if (hash >= 0) source = source.slice(0, hash);
	if (/^(?:https?:)?\/\//i.test(source)) {
		let url: URL;
		try {
			url = new URL(source, "https://example.invalid");
		} catch {
			return null;
		}
		const prefix = `/${context.owner}/${context.repo}/`;
		const pathname = decode(url.pathname);
		if (!pathname?.toLowerCase().startsWith(prefix.toLowerCase())) return null;
		const rest = pathname.slice(prefix.length).replace(/^refs\/heads\//, "");
		if (url.hostname === "github.com") {
			const marker = ["blob", "raw"].find((kind) =>
				rest.startsWith(`${kind}/${context.branch}/`),
			);
			if (!marker) return null;
			source = rest.slice(marker.length + context.branch.length + 2);
		} else if (
			url.hostname === "raw.githubusercontent.com" &&
			rest.startsWith(`${context.branch}/`)
		) {
			source = rest.slice(context.branch.length + 1);
		} else return null;
	} else if (
		source.startsWith("/api/media?") ||
		source.startsWith("/api/image?")
	) {
		const url = new URL(source, "https://example.invalid");
		source = url.searchParams.get("path") ?? url.searchParams.get("file") ?? "";
	} else if (source.startsWith("/api/image/")) {
		try {
			source = atob(source.slice(11).replace(/-/g, "+").replace(/_/g, "/"));
		} catch {
			return null;
		}
	} else if (/^[a-z][a-z0-9+.-]*:/i.test(source)) return null;
	const query = source.indexOf("?");
	const suffix = (query < 0 ? "" : source.slice(query)) + fragment;
	const path = rootedPath(
		query < 0 ? source : source.slice(0, query),
		documentPath,
		context.mediaRoot,
	);
	return path ? { path, suffix } : null;
}

/**
 * Scan portable path tokens, including frontmatter, HTML and plain-text posts.
 * Code examples count conservatively as usages so cleanup cannot remove them.
 * Keep offsets to update only paths, never reserialize authors' documents.
 */
export function collectMediaReferences(
	raw: string,
	documentPath: string,
	context: MediaReferenceContext,
): MediaReference[] {
	const references: MediaReference[] = [];
	const occupied: Array<[number, number]> = [];
	const add = (value: string, from: number) => {
		if (occupied.some(([start, end]) => from >= start && from < end)) return;
		const resolved = resolveReference(value, documentPath, context);
		if (!resolved) return;
		const to = from + value.length;
		references.push({ ...resolved, from, to, value, documentPath });
		occupied.push([from, to]);
	};
	// Quoted/angle-bracket destinations may contain literal spaces.
	for (const match of raw.matchAll(/["'<]([^"'<>\r\n]+)["'>]/g)) {
		add(match[1], match.index + 1);
	}
	for (const match of raw.matchAll(
		/^[ \t]*(?:coverImage|image|src):[ \t]*([^\r\n]+)/gm,
	)) {
		const value = match[1].replace(/\s+#.*$/, "").trimEnd();
		add(value, match.index + match[0].indexOf(match[1]));
	}
	for (const match of raw.matchAll(
		/(?:https?:\/\/|\/\/)[^\s<>"'`]+|(?:\/api\/(?:media|image)\?[^\s<>"'`)]+)|(?:\/api\/image\/[^\s<>"'`)]+)|(?:\\[ ()]|[^\s<>"'`()[\]{}])(?:\([^()\s]*\)|\\[ ()]|[^\s<>"'`()[\]{}])*/g,
	)) {
		// Do not treat a path inside an unrelated remote URL as a local reference.
		const value = match[0].replace(/[).,;]+$/, "");
		add(value, match.index);
	}
	return references.sort((a, b) => a.from - b.from);
}

/** Fail closed if semantic Markdown/YAML references cannot be safely rewritten. */
export function verifyMediaReferences(
	raw: string,
	frontmatter: Record<string, unknown>,
	references: MediaReference[],
	documentPath: string,
	context: MediaReferenceContext,
) {
	const paths = new Set(references.map((reference) => reference.path));
	const verify = (value: unknown, metadata = false): void => {
		if (typeof value === "string" && metadata) {
			const reference = resolveReference(value, documentPath, context);
			if (reference && !paths.has(reference.path))
				throw new Error(
					`Cannot safely scan a media reference in ${documentPath}. Simplify its image path before managing media.`,
				);
		} else if (Array.isArray(value)) {
			for (const item of value) verify(item, metadata);
		} else if (value && typeof value === "object") {
			for (const [key, item] of Object.entries(value))
				verify(item, metadata || key === "src" || key === "href");
		}
	};
	verify(frontmatter, true);
	verify(parseMarkdown(raw, { frontmatter: true }));
}

export function replaceMediaReferences(
	raw: string,
	references: MediaReference[],
	moves: Map<string, string>,
) {
	let result = raw;
	for (const reference of [...references].sort((a, b) => b.from - a.from)) {
		const target = moves.get(reference.path);
		if (!target) continue;
		const next = movedReferenceValue(reference, target);
		result =
			result.slice(0, reference.from) + next + result.slice(reference.to);
	}
	return result;
}

function movedReferenceValue(reference: MediaReference, target: string) {
	const encode = (path: string) =>
		path.split("/").map(encodeURIComponent).join("/");
	if (/^(?:https?:)?\/\//i.test(reference.value)) {
		const url = new URL(reference.value, "https://example.invalid");
		const decodedPath = decodeURIComponent(url.pathname);
		url.pathname = encode(
			decodedPath.slice(0, -reference.path.length) + target,
		);
		return url.toString();
	}
	if (/^\/api\/(?:media|image)/.test(reference.value)) {
		const url = new URL(
			reference.value.replace(/&amp;/g, "&"),
			"https://example.invalid",
		);
		url.pathname = "/api/media";
		url.searchParams.delete("file");
		url.searchParams.set("path", target);
		return `${url.pathname}${url.search}${url.hash}`;
	}
	if (reference.value.startsWith("../") || reference.value.startsWith("./")) {
		const from = reference.documentPath.split("/").slice(0, -1);
		const to = target.split("/");
		while (from.length && to.length && from[0] === to[0]) {
			from.shift();
			to.shift();
		}
		return `${"../".repeat(from.length) || "./"}${encode(to.join("/"))}${reference.suffix}`;
	}
	return `${reference.value.startsWith("/") ? "/" : ""}${encode(target)}${reference.suffix}`;
}
