import { parse, stringify } from "yaml";

/**
 * Frontmatter is always a small map of scalars written by this app. Anything
 * larger is either corrupt or hostile, so it is rejected before parsing.
 */
export const MAX_FRONTMATTER_BYTES = 64 * 1024;

/**
 * `yaml` refuses to expand more aliases than this, which is what stops YAML
 * expansion bombs ("billion laughs") from exhausting memory while parsing
 * repository content. Frontmatter never legitimately uses anchors.
 */
const MAX_ALIAS_COUNT = 100;

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const OPEN_DELIMITER = /^---[ \t]*$/;
const CLOSE_DELIMITER = /^(?:---|\.\.\.)[ \t]*$/;

export class FrontmatterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FrontmatterError";
	}
}

export interface ParsedFrontmatter {
	data: Record<string, unknown>;
	body: string;
}

function toPlainRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).filter(
			([key]) => !FORBIDDEN_KEYS.has(key),
		),
	);
}

/**
 * Splits a markdown document into its YAML frontmatter and its body.
 *
 * Documents without frontmatter are returned unchanged with empty data, which
 * lets callers treat "no metadata yet" and "metadata present" identically.
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
	const source = raw.replace(/^\uFEFF/, "");
	const lines = source.split(/\r?\n/);

	if (lines.length === 0 || !OPEN_DELIMITER.test(lines[0] ?? "")) {
		return { data: {}, body: source.trim() };
	}

	const closeIndex = lines.findIndex(
		(line, index) => index > 0 && CLOSE_DELIMITER.test(line),
	);

	if (closeIndex === -1) {
		return { data: {}, body: source.trim() };
	}

	const block = lines.slice(1, closeIndex).join("\n");

	if (Buffer.byteLength(block, "utf8") > MAX_FRONTMATTER_BYTES) {
		throw new FrontmatterError("Frontmatter block is too large");
	}

	let parsed: unknown;
	try {
		parsed = parse(block, { maxAliasCount: MAX_ALIAS_COUNT, version: "1.2" });
	} catch (error) {
		throw new FrontmatterError(
			error instanceof Error ? error.message : "Invalid frontmatter",
		);
	}

	return {
		data: toPlainRecord(parsed),
		body: lines
			.slice(closeIndex + 1)
			.join("\n")
			.trim(),
	};
}

/** Returns only the document body, discarding any frontmatter it carries. */
export function stripFrontmatter(raw: string): string {
	return parseFrontmatter(raw).body;
}

function isEmptyValue(value: unknown) {
	return (
		value === undefined ||
		value === null ||
		(Array.isArray(value) && value.length === 0)
	);
}

/**
 * Serializes metadata into a `---` delimited YAML block. Empty values are
 * dropped so absent metadata never lands in the repository as `null`.
 */
export function stringifyFrontmatter(data: Record<string, unknown>): string {
	const cleaned = Object.fromEntries(
		Object.entries(data).filter(([, value]) => !isEmptyValue(value)),
	);

	const yaml = stringify(cleaned, { lineWidth: 0 }).trim();

	return `---\n${yaml}\n---`;
}

/** Builds a complete markdown document from metadata and a body. */
export function buildMarkdownDocument(
	data: Record<string, unknown>,
	body: string,
): string {
	return `${stringifyFrontmatter(data)}\n\n${body.trim()}\n`;
}
