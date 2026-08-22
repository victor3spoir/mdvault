import type { CodeHighlighter } from "@tanstack/markdown";

/**
 * Client-side highlighter: a lookup, not a highlighter.
 *
 * The server already turned every fence into HTML (see
 * `docs.content.server.ts`) and shipped the result in the loader payload. This
 * adapter satisfies `RenderOptions.highlighter` by reading that map, which
 * keeps the tokenizer and all twenty-six language definitions out of the
 * browser bundle.
 *
 * A miss can only happen if a fence is rendered that the server never parsed —
 * it falls back to escaped plain text rather than throwing, because a
 * momentarily unstyled code block is a far smaller failure than a blank page.
 */
export function createLookupHighlighter(
	rendered: Record<string, string>,
): CodeHighlighter {
	return (code, lang = "plaintext") =>
		rendered[`${lang}\u0000${code}`] ?? escapeHtml(code);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
