import type { MarkdownDocument, MarkdownHeading } from "@tanstack/markdown";
import { z } from "zod";

/**
 * Frontmatter contract.
 *
 * Validated at load time and **strictly**: a page whose frontmatter is
 * malformed must fail loudly, because a page that silently disappears from the
 * sidebar is nearly impossible to notice.
 */
export const DocsFrontmatterSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	/** Sidebar position inside its section; falls back to the title. */
	order: z.number().int().optional(),
	/** Extra terms fed to the search index. */
	keywords: z.array(z.string()).optional(),
	/** Hides the page from navigation and search without deleting it. */
	draft: z.boolean().optional(),
});
export type DocsFrontmatter = z.infer<typeof DocsFrontmatterSchema>;

/** A discovered Markdown file, before parsing. */
export type DocsPageMeta = {
	/** `features/authentication` — the URL path after the route base. */
	slug: string;
	/** Section id, or `""` for a top-level page. */
	section: string;
	/** Absolute path on disk, server-side only. */
	file: string;
	frontmatter: DocsFrontmatter;
};

/**
 * A page ready to render.
 *
 * `document` is the parsed tree and `highlighted` the code blocks already
 * highlighted on the server, keyed by language + source, so the browser never
 * ships or re-runs the highlighter.
 */
export type DocsPage = {
	slug: string;
	section: string;
	frontmatter: DocsFrontmatter;
	document: MarkdownDocument;
	headings: Array<MarkdownHeading>;
	highlighted: Record<string, string>;
	/** Raw Markdown, for "Copy page". */
	source: string;
};

export type DocsNavLink = {
	slug: string;
	title: string;
	description: string;
};

export type DocsNavGroup = {
	id: string;
	label: string;
	icon?: string;
	links: Array<DocsNavLink>;
};

export type DocsNav = {
	/** Ungrouped entries shown above the groups, with an icon each. */
	top: Array<DocsNavLink & { icon?: string }>;
	groups: Array<DocsNavGroup>;
	/** Flat reading order, used by the previous/next pager. */
	order: Array<DocsNavLink>;
};

/**
 * One record per heading rather than per page: a per-page hit lands the reader
 * at the top of a long document and makes them scroll, which reads as the
 * search not working.
 */
export type DocsSearchRecord = {
	/** `${slug}#${headingId}` */
	id: string;
	slug: string;
	title: string;
	heading: string;
	headingId: string;
	section: string;
	content: string;
};
