export type ReleaseSection = {
	title: string;
	items: Array<string>;
};

export type ProductRelease = {
	version: string;
	date?: string;
	summary: string;
	sections: Array<ReleaseSection>;
};

/**
 * Portable release history for the standalone product site.
 * Keep this in sync with the repository's root CHANGELOG.md.
 */
export const productReleases: Array<ProductRelease> = [
	{
		version: "1.3.0",
		date: "2026-09-14",
		summary:
			"Block and image actions, bulk media management, usage scans and more reliable content refresh, with updated screenshots and feature guides.",
		sections: [
			{
				title: "Editor",
				items: [
					"Delete the hovered block from its drag controls or the current block from the footer, with Undo to restore it. Nested selections act on their containing top-level block.",
					"Replace images in place while preserving width, alignment, alt text and captions, or remove an image from the document without deleting its library file.",
					"Insert note callouts directly from the toolbar.",
					"Author H2–H4 consistently, with H4 in slash commands, previews and article tables of contents. Existing H1/H5/H6 remain preserved.",
					"Load article, post and Vault editors with layout-matched placeholders; preserve selection when moving image blocks and prevent stale hover deletions.",
				],
			},
			{
				title: "Media management",
				items: [
					"Move up to 100 selected assets into a folder, with an affected-document count. Existing bulk deletion now uses one atomic commit with server-side guards.",
					"Move images and update detected references in managed articles, posts and Vault entries in one Git commit, without overwriting existing destinations.",
					"Scan usage to browse All, Unused and Missing views, with reference counts and links to affected entries.",
					"Block deletion of referenced assets and stop cleanup when scans are incomplete. Bulk deletion is atomic and recoverable through Git history.",
					"Keep nested image paths intact in previews, downloads and copied links; search full paths in image pickers with clearer errors and retry controls.",
					"Scans cover managed Markdown/MDX on the default branch only, not external consumers, unsaved drafts, other branches or unmanaged files.",
				],
			},
			{
				title: "Content and interface fixes",
				items: [
					"Refresh article/post cards and dashboard counts after creation, saves, publishing, unpublishing and deletion, while reapplying active filters.",
					"Refresh media galleries, pickers, audits and affected content together after media operations.",
					"Match plain-text typography across editing and reading, preserve whitespace and wrap long strings. Plain Vault previews no longer interpret Markdown.",
					"Remove duplicate post excerpts and display Markdown-like text and HTML literally in plain-text content.",
				],
			},
			{
				title: "Documentation and maintenance",
				items: [
					"Refresh product screenshots, feature guides and release notes, including language settings, Vault translations and safe deletion workflows.",
					"Consolidate the website in mdvault-docs, remove the legacy docs site and obsolete brand sources, and preserve README imagery under images.",
					"Update Sharp and container packages, exclude local build output from Docker, and correct image tags and security-report handling.",
				],
			},
			{
				title: "Known limitations",
				items: [
					"Escaped frontmatter paths may survive a move unchanged. Review the resulting Git diff for those documents.",
					"Document-relative image paths containing ../ are not consistently rendered, and absolute app-proxy URLs are not included in usage scans. Prefer full repository paths and check external consumers.",
					"Dashboard media activity can label move/delete commits as uploads.",
				],
			},
		],
	},
	{
		version: "1.2.0",
		date: "2026-08-22",
		summary:
			"Multilingual content, Mermaid diagrams, a smarter editor with slash commands, callouts, embeds and find & replace — plus a brand new documentation site.",
		sections: [
			{
				title: "Product",
				items: [
					"Added translations: link articles and Vault content across languages, with locale flags and language filters on every list.",
					"Added content language settings so each vault declares the locales it publishes in.",
					"Rendered Mermaid diagrams in articles and previews, with HCL syntax highlighting.",
					"Added slash commands, callout blocks, YouTube/Vimeo embeds, checklists, find & replace, a document outline and drag-to-reorder blocks in the editor.",
					"Added a toggle between the rich editor and the raw Markdown source, plus TOML and TSX code block languages.",
					"Accepted SVG uploads, optimised images on upload, allowed media downloads and served images through an /api/media proxy.",
					"Launched the new documentation site with a landing page, docs and this changelog.",
				],
			},
			{
				title: "Fixes",
				items: [
					"Cleaned pasted HTML and text into Markdown-friendly content.",
					"Added content checks that flag missing alt text and empty headings before publishing.",
					"Kept plain-text posts free of Markdown artefacts and stopped the breadcrumb overflowing its header.",
					"Aligned code blocks and tables consistently between the editor and the rendered page.",
				],
			},
			{
				title: "Engineering",
				items: [
					"Centralised post-mutation refresh logic.",
					"Dropped dead style rules in favour of theme tokens and removed unused dependencies.",
				],
			},
		],
	},
	{
		version: "1.1.0",
		date: "2026-08-02",
		summary:
			"A richer writing experience, custom content types, stronger security and a faster GitHub-backed content engine.",
		sections: [
			{
				title: "Product",
				items: [
					"Introduced a Tiptap editor with tables, images, code blocks and syntax highlighting.",
					"Added live split preview, local draft recovery and image display controls.",
					"Added user-defined Vault content types with their own repository folders and workflows.",
					"Added a command palette and shared URL-backed filters across content lists.",
					"Redesigned the dashboard and expanded media upload and reuse tools.",
				],
			},
			{
				title: "Security",
				items: [
					"Hardened frontmatter parsing against oversized metadata and YAML alias expansion.",
					"Bounded the rate limiter and limited forwarded IP trust to configured proxies.",
					"Added runtime media validation, Content Security Policy and write-request origin checks.",
					"Resolved dependency advisories.",
				],
			},
			{
				title: "Engineering",
				items: [
					"Consolidated article, post and Vault content engines into a shared content store.",
					"Added a shared GitHub file layer with bounded concurrency and short-lived caches.",
					"Added reduced-motion safeguards and accessible confirmation dialogs.",
				],
			},
		],
	},
	{
		version: "1.0.0",
		date: "2026-02-27",
		summary:
			"The first stable release, with GitHub-backed content, private media delivery and production documentation.",
		sections: [
			{
				title: "Highlights",
				items: [
					"Introduced an on-demand hybrid media cache using Blob URLs.",
					"Expanded GitHub token and environment configuration documentation.",
					"Established the stable production baseline for MDVault.",
				],
			},
		],
	},
	{
		version: "0.1.x",
		summary:
			"The initial product foundation, including dark mode, CI hardening and the first Markdown editing workflows.",
		sections: [
			{
				title: "Foundation",
				items: [
					"Launched the baseline CMS and repository-backed publishing workflow.",
					"Improved editor highlighting, media performance and dark-mode styling.",
					"Reworked CI and security scans through the early production iterations.",
				],
			},
		],
	},
];
