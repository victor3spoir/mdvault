import { defineLanguage, type TokenRange } from "@tanstack/highlight/core";

const KEYWORDS = new Set([
	"begin",
	"break",
	"catch",
	"class",
	"clean",
	"continue",
	"data",
	"define",
	"do",
	"dynamicparam",
	"else",
	"elseif",
	"end",
	"enum",
	"exit",
	"filter",
	"finally",
	"for",
	"foreach",
	"from",
	"function",
	"if",
	"in",
	"inlinescript",
	"parallel",
	"param",
	"process",
	"return",
	"sequence",
	"switch",
	"throw",
	"trap",
	"try",
	"until",
	"using",
	"var",
	"while",
	"workflow",
]);

const OPERATORS =
	/^-(?:(?:i|c)?(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|split)|and|or|xor|not|band|bor|bxor|bnot|shl|shr|join|is|isnot|as|f)$/i;

// A lightweight snippet grammar, matching the existing custom C# and HCL support.
const TOKEN_PATTERN =
	/(?<comment><#[\s\S]*?(?:#>|(?![\s\S]))|#[^\r\n]*)|(?<string>@"\r?\n[\s\S]*?(?:^"@|(?![\s\S]))|@'\r?\n[\s\S]*?(?:^'@|(?![\s\S]))|"(?:\x60[\s\S]|""|[^"\x60])*"?|'(?:''|[^'])*'?)|(?<escape>\x60[\s\S])|(?<variable>\$\{[^}]*\}|\$(?:[\w]+:)?[\w?^$]+)|(?<type>\[[A-Za-z_][\w.[\], ]*\])|(?<parameter>-[A-Za-z][\w-]*)|(?<number>\b(?:0x[\da-f]+|0b[01]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)(?:[uylndf]|ul|kb|mb|gb|tb|pb)?\b)|(?<word>\b[A-Za-z_][\w]*(?:-[\w]+)*\b)/gim;

export const powershell = defineLanguage({
	name: "powershell",
	aliases: ["pwsh", "ps1"],
	tokenize(code) {
		const ranges: TokenRange[] = [];
		for (const match of code.matchAll(TOKEN_PATTERN)) {
			const groups = match.groups ?? {};
			let className: TokenRange["className"] | undefined;
			if (groups.comment !== undefined) className = "comment";
			else if (groups.string !== undefined) className = "string";
			else if (groups.escape !== undefined) className = "meta";
			else if (groups.variable !== undefined) {
				className = /^\$(?:true|false|null)$/i.test(match[0])
					? "literal"
					: "variable";
			} else if (groups.type !== undefined) className = "type";
			else if (groups.parameter !== undefined) {
				className = OPERATORS.test(match[0]) ? "operator" : "attr";
			} else if (groups.number !== undefined) className = "number";
			else if (groups.word !== undefined) {
				if (KEYWORDS.has(match[0].toLowerCase())) className = "keyword";
				else if (match[0].includes("-")) className = "command";
			}
			if (className) {
				ranges.push({
					start: match.index,
					end: match.index + match[0].length,
					className,
				});
			}
		}
		return ranges;
	},
});
