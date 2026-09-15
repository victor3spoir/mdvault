import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "#/features/content/components/markdown-content";
import { highlighter } from "#/lib/highlight";

const source =
	'# List processes\nIF ($count -gt 2 -and $true) {\n  Get-Process -Name "pwsh" | Select-Object -First 3\n}';

function tokens(code: string, lang = "powershell") {
	return highlighter.highlight(code, { lang }).tokens;
}

describe("PowerShell highlighting", () => {
	it.each([
		"powershell",
		"pwsh",
		"ps1",
	])("supports %s without changing source", (lang) => {
		const result = tokens(source, lang);
		expect(result.map((token) => token.value).join("")).toBe(source);
		for (const [value, className] of [
			["# List processes", "comment"],
			["IF", "keyword"],
			["$count", "variable"],
			["-gt", "operator"],
			["-and", "operator"],
			["$true", "literal"],
			["Get-Process", "command"],
			["-Name", "attr"],
			['"pwsh"', "string"],
			["3", "number"],
		])
			expect(result).toContainEqual(
				expect.objectContaining({ value, className }),
			);
	});

	it.each([
		"powershell",
		"pwsh",
	])("highlights %s in the shared preview renderer", (lang) => {
		const fence = String.fromCharCode(96).repeat(3);
		const html = renderToStaticMarkup(
			createElement(MarkdownContent, {
				source: [fence + lang, source, fence].join("\n"),
			}),
		);
		expect(html).toContain('class="th-token th-command">Get-Process</span>');
		expect(html).toContain('class="th-token th-variable">$count</span>');
	});

	it("recognizes scoped variables, braced variables, types and case-insensitive literals", () => {
		const bracedVariable = ["$", "{a-b}"].join("");
		const result = tokens(
			["[int] $env:PATH", bracedVariable, "$NULL; 0xff; 2GB"].join("; "),
		);
		for (const [value, className] of [
			["[int]", "type"],
			["$env:PATH", "variable"],
			[bracedVariable, "variable"],
			["$NULL", "literal"],
			["0xff", "number"],
			["2GB", "number"],
		])
			expect(result).toContainEqual(
				expect.objectContaining({ value, className }),
			);
	});

	it("keeps comments and strings opaque, including here-strings and escaped quotes", () => {
		for (const value of [
			"<# Get-Process $true\n#>",
			"'it''s # not a comment'",
			'"hello \x60"world\x60""',
			'@"\nGet-Process "$count"\n"@',
			"@'\nGet-Process '$count'\n'@",
		]) {
			const result = tokens(value);
			expect(result.map((token) => token.value).join("")).toBe(value);
			expect(result).toEqual([
				expect.objectContaining({
					value,
					className: value.startsWith("<#") ? "comment" : "string",
				}),
			]);
		}
	});
});
