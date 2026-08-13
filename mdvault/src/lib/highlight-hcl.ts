import { defineLanguage, type TokenRange } from "@tanstack/highlight/core";

/** Top level blocks used by Terraform, OpenTofu and docker-bake. */
const BLOCK_KEYWORDS = new Set([
	"resource",
	"data",
	"provider",
	"variable",
	"output",
	"locals",
	"module",
	"terraform",
	"provisioner",
	"backend",
	"dynamic",
	"lifecycle",
	"moved",
	"import",
	"check",
	"removed",
	"target",
	"group",
	"function",
]);

const KEYWORDS = new Set([
	"for",
	"in",
	"if",
	"else",
	"endif",
	"endfor",
	"can",
	"try",
	"depends_on",
	"count",
	"for_each",
	"providers",
	"source",
	"version",
]);

const LITERALS = new Set(["true", "false", "null"]);

const BUILTIN_FUNCTIONS = new Set([
	"abs",
	"abspath",
	"alltrue",
	"anytrue",
	"basename",
	"base64decode",
	"base64encode",
	"cidrsubnet",
	"coalesce",
	"compact",
	"concat",
	"contains",
	"dirname",
	"distinct",
	"element",
	"endswith",
	"file",
	"fileexists",
	"flatten",
	"format",
	"formatdate",
	"formatlist",
	"index",
	"join",
	"jsondecode",
	"jsonencode",
	"keys",
	"length",
	"lookup",
	"lower",
	"max",
	"merge",
	"min",
	"pathexpand",
	"regex",
	"regexall",
	"replace",
	"reverse",
	"setunion",
	"sha256",
	"slice",
	"sort",
	"split",
	"startswith",
	"substr",
	"templatefile",
	"timestamp",
	"tolist",
	"tomap",
	"tonumber",
	"toset",
	"tostring",
	"trim",
	"trimprefix",
	"trimspace",
	"trimsuffix",
	"upper",
	"uuid",
	"values",
	"yamldecode",
	"yamlencode",
	"zipmap",
]);

/** Identifiers that open an interpolation scope, e.g. `var.name`. */
const SCOPES = new Set([
	"var",
	"local",
	"module",
	"each",
	"count",
	"path",
	"self",
	"terraform",
]);

const TOKEN_PATTERN =
	/(?<comment>#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<heredoc><<[-~]?(?<tag>\w+)[\s\S]*?^\s*\k<tag>)|(?<string>"(?:[^"\\]|\\.)*")|(?<number>\b\d+(?:\.\d+)?\b)|(?<word>[A-Za-z_][\w-]*)/gm;

/**
 * HCL grammar, written by hand because `@tanstack/highlight` ships none. Covers
 * what appears in documentation snippets, not the full language.
 */
export const hcl = defineLanguage({
	name: "hcl",
	aliases: ["terraform", "tf", "tfvars", "tofu", "opentofu", "docker-bake"],
	tokenize(code) {
		const ranges: Array<TokenRange> = [];
		TOKEN_PATTERN.lastIndex = 0;
		let match: RegExpExecArray | null = TOKEN_PATTERN.exec(code);

		while (match !== null) {
			const groups = match.groups ?? {};
			const start = match.index;
			const end = start + match[0].length;

			if (groups.comment !== undefined) {
				ranges.push({ start, end, className: "comment" });
			} else if (groups.heredoc !== undefined || groups.string !== undefined) {
				ranges.push({ start, end, className: "string" });
			} else if (groups.number !== undefined) {
				ranges.push({ start, end, className: "number" });
			} else if (groups.word !== undefined) {
				const word = groups.word;
				const followedByCall = code[end] === "(";

				if (BLOCK_KEYWORDS.has(word)) {
					ranges.push({ start, end, className: "keyword" });
				} else if (KEYWORDS.has(word)) {
					ranges.push({ start, end, className: "keyword" });
				} else if (LITERALS.has(word)) {
					ranges.push({ start, end, className: "literal" });
				} else if (followedByCall && BUILTIN_FUNCTIONS.has(word)) {
					ranges.push({ start, end, className: "function" });
				} else if (SCOPES.has(word) && code[end] === ".") {
					ranges.push({ start, end, className: "type" });
				}
			}

			match = TOKEN_PATTERN.exec(code);
		}

		return ranges;
	},
});
