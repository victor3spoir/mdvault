import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { diff } from "@tanstack/highlight/languages/diff";
import { dockerfile } from "@tanstack/highlight/languages/dockerfile";
import { env } from "@tanstack/highlight/languages/env";
import { html } from "@tanstack/highlight/languages/html";
import { http } from "@tanstack/highlight/languages/http";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { nginx } from "@tanstack/highlight/languages/nginx";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { python } from "@tanstack/highlight/languages/python";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { toml } from "@tanstack/highlight/languages/toml";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";
import { createThemeCss } from "@tanstack/highlight/theme";
import { githubDarkTheme } from "@tanstack/highlight/themes/github-dark";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";
import { csharp } from "#/lib/highlight-csharp";

/**
 * Isomorphic highlighter shared by SSR and the browser. Unknown languages
 * degrade to escaped plain text.
 */
export const highlighter = createHighlighter({
	languages: [
		plaintext,
		csharp,
		css,
		diff,
		dockerfile,
		env,
		html,
		http,
		js,
		json,
		jsx,
		markdown,
		nginx,
		python,
		shell,
		sql,
		toml,
		ts,
		tsx,
		yaml,
	],
});

export const highlightThemeCss = createThemeCss({
	light: githubLightTheme,
	dark: githubDarkTheme,
	lightSelector: ":root",
	darkSelector: ".dark",
});
