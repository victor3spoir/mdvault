import {
	type DocsFrontmatter,
	DocsFrontmatterSchema,
} from "#/features/docs/docs.types";

/**
 * Minimal YAML reader for the frontmatter contract.
 *
 * `@tanstack/markdown` hands frontmatter back as raw text, and the contract in
 * `docs.types.ts` is five scalar keys plus one string list. Pulling a full YAML
 * parser into the bundle to read that would cost more than it explains — and a
 * deliberately small reader makes unsupported syntax fail at authoring time
 * instead of quietly producing something unexpected.
 *
 * Supported: `key: value`, quoted values, `true`/`false`, integers, inline
 * lists `[a, b]` and block lists (`- item`). Comments (`#`) on their own line.
 */
export function parseFrontmatter(
	raw: string | undefined,
	slug: string,
): DocsFrontmatter {
	const record = readYamlSubset(raw ?? "");
	const parsed = DocsFrontmatterSchema.safeParse(record);

	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
			.join(", ");

		throw new Error(
			`Invalid frontmatter in content/docs/${slug}.md — ${issues}. ` +
				"Every page needs at least a `title` and a `description`.",
		);
	}

	return parsed.data;
}

function readYamlSubset(raw: string): Record<string, unknown> {
	const record: Record<string, unknown> = {};
	const lines = raw.split(/\r?\n/);

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index] ?? "";

		if (!line.trim() || line.trim().startsWith("#")) continue;

		const match = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
		if (!match) continue;

		const [, key, rest] = match as [string, string, string];

		if (rest === "") {
			const items: Array<string> = [];

			while (index + 1 < lines.length) {
				const item = (lines[index + 1] ?? "").match(/^\s*-\s+(.*)$/);
				if (!item) break;
				items.push(readScalar(item[1] as string) as string);
				index++;
			}

			record[key] = items;
			continue;
		}

		record[key] = readValue(rest);
	}

	return record;
}

function readValue(value: string): unknown {
	const trimmed = value.trim();

	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		const inner = trimmed.slice(1, -1).trim();
		if (!inner) return [];
		return inner.split(",").map((entry) => readScalar(entry.trim()));
	}

	return readScalar(trimmed);
}

function readScalar(value: string): unknown {
	const unquoted =
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
			? value.slice(1, -1)
			: value;

	if (unquoted === "true") return true;
	if (unquoted === "false") return false;
	if (/^-?\d+$/.test(unquoted)) return Number(unquoted);

	return unquoted;
}
