import { defineLanguage, type TokenRange } from "@tanstack/highlight/core";

const KEYWORDS = new Set([
	"abstract",
	"as",
	"async",
	"await",
	"base",
	"break",
	"case",
	"catch",
	"checked",
	"class",
	"const",
	"continue",
	"default",
	"delegate",
	"do",
	"else",
	"enum",
	"event",
	"explicit",
	"extern",
	"finally",
	"fixed",
	"for",
	"foreach",
	"get",
	"global",
	"goto",
	"if",
	"implicit",
	"in",
	"init",
	"interface",
	"internal",
	"is",
	"lock",
	"nameof",
	"namespace",
	"new",
	"operator",
	"out",
	"override",
	"params",
	"partial",
	"private",
	"protected",
	"public",
	"readonly",
	"record",
	"ref",
	"required",
	"return",
	"sealed",
	"set",
	"sizeof",
	"stackalloc",
	"static",
	"struct",
	"switch",
	"this",
	"throw",
	"try",
	"typeof",
	"unchecked",
	"unsafe",
	"using",
	"value",
	"var",
	"virtual",
	"volatile",
	"when",
	"where",
	"while",
	"with",
	"yield",
]);

const TYPES = new Set([
	"bool",
	"byte",
	"char",
	"decimal",
	"double",
	"dynamic",
	"float",
	"int",
	"long",
	"nint",
	"nuint",
	"object",
	"sbyte",
	"short",
	"string",
	"uint",
	"ulong",
	"ushort",
	"void",
]);

const LITERALS = new Set(["true", "false", "null"]);

const TOKEN_PATTERN = new RegExp(
	[
		// comments: /// doc, // line, /* block */
		String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
		// strings: $@"..."/@$"...", @"..." (doubled quotes), $"..."/"..." , 'c'
		String.raw`(?<string>[$@]{1,2}"(?:[^"]|"")*"|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')`,
		// attribute: [Attribute(...)] at line scope
		String.raw`(?<meta>^[ \t]*\[[A-Za-z_][\w.]*(?:\([^\n\]]*\))?\][ \t]*$)`,
		// numbers: hex, binary, decimal with suffixes
		String.raw`(?<number>\b0[xX][0-9a-fA-F_]+\b|\b0[bB][01_]+\b|\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[fFdDmMuUlL]{0,3}\b)`,
		// words: keywords, types, literals
		String.raw`(?<word>\b[A-Za-z_][\w]*\b)`,
	].join("|"),
	"gm",
);

/**
 * C# language definition for TanStack Highlight (not shipped upstream).
 * Covers comments, strings (verbatim/interpolated), attributes, numbers,
 * keywords, built-in types, and literals.
 */
export const csharp = defineLanguage({
	name: "csharp",
	aliases: ["cs", "c#", "dotnet"],
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
			} else if (groups.string !== undefined) {
				ranges.push({ start, end, className: "string" });
			} else if (groups.meta !== undefined) {
				ranges.push({ start, end, className: "meta" });
			} else if (groups.number !== undefined) {
				ranges.push({ start, end, className: "number" });
			} else if (groups.word !== undefined) {
				const word = groups.word;
				if (KEYWORDS.has(word)) {
					ranges.push({ start, end, className: "keyword" });
				} else if (TYPES.has(word)) {
					ranges.push({ start, end, className: "type" });
				} else if (LITERALS.has(word)) {
					ranges.push({ start, end, className: "literal" });
				}
			}

			match = TOKEN_PATTERN.exec(code);
		}

		return ranges;
	},
});
