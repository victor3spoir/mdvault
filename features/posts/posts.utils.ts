import type { PostFrontmatter } from "./posts.types";

const FRONTMATTER_DELIMITER = "---";
const YAML_QUOTE_PATTERN = /[:\n"']/;

const FRONTMATTER_FIELDS: Array<keyof PostFrontmatter> = [
  "title",
  "description",
  "published",
  "author",
  "coverImage",
  "createdAt",
  "updatedAt",
  "publishedDate",
  "tags",
];

type FrontmatterValue = string | boolean | string[] | null;

function escapeYamlString(value: string): string {
  if (YAML_QUOTE_PATTERN.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `"${value}"`;
}

function formatValue(value: FrontmatterValue): string {
  if (value === undefined || value === null) {
    throw new Error("Cannot format undefined or null value");
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "string") {
    return escapeYamlString(value);
  }
  if (Array.isArray(value)) {
    if (!value.every((item) => typeof item === "string")) {
      throw new Error("Invalid array in frontmatter: expected string[]");
    }
    return `[${(value as string[]).map(escapeYamlString).join(", ")}]`;
  }
  throw new Error(`Invalid frontmatter value type: ${typeof value}`);
}

export function generateFrontmatter(data: PostFrontmatter): string {
  const lines = [FRONTMATTER_DELIMITER];

  for (const field of FRONTMATTER_FIELDS) {
    const value = data[field];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;

    try {
      lines.push(`${field}: ${formatValue(value)}`);
    } catch (error) {
      throw new Error(
        `Invalid frontmatter value for field "${field}": ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  lines.push(FRONTMATTER_DELIMITER);
  return lines.join("\n");
}

function removeQuotes(value: string): string {
  if (value.length < 2) {
    throw new Error("Invalid quoted value: too short");
  }
  return value.slice(1, -1);
}

function parseBoolean(value: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseTags(value: string): string[] | null {
  if (!value.startsWith("[") || !value.endsWith("]")) {
    return null;
  }
  const content = value.slice(1, -1).trim();
  if (!content) return [];

  return content
    .split(",")
    .map((t) => {
      const trimmed = t.trim();
      if (!trimmed) return null;
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return removeQuotes(trimmed);
      }
      return trimmed;
    })
    .filter((t): t is string => t !== null);
}

function parseStringValue(value: string): string {
  const isQuoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  return isQuoted ? removeQuotes(value) : value;
}

function parseValue(key: string, value: string): FrontmatterValue {
  try {
    if (key === "published") return parseBoolean(value);
    if (key === "tags") return parseTags(value);
    return parseStringValue(value);
  } catch (error) {
    console.error(`Error parsing field "${key}" with value "${value}":`, error);
    return "";
  }
}

function extractFrontmatterLines(content: string): {
  lines: string[];
  body: string;
} {
  if (typeof content !== "string") {
    throw new Error("Content must be a string");
  }

  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { lines: [], body: content };
  }

  const lines = match[1].split("\n");
  const body = content.slice(match[0].length);
  return { lines, body };
}

export function parseFrontmatter(content: string): {
  frontmatter: PostFrontmatter;
  body: string;
} {
  if (typeof content !== "string") {
    throw new Error("Content must be a string");
  }

  const { lines, body } = extractFrontmatterLines(content);
  const frontmatter: PostFrontmatter = { title: "Untitled", published: false };

  for (const line of lines) {
    if (typeof line !== "string") continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (!FRONTMATTER_FIELDS.includes(key as keyof PostFrontmatter)) {
      continue;
    }

    const parsed = parseValue(key, value);
    if (parsed !== undefined) {
      try {
        Object.assign(frontmatter, { [key]: parsed });
      } catch (error) {
        console.error(`Failed to assign field "${key}":`, error);
      }
    }
  }

  return { frontmatter, body };
}
