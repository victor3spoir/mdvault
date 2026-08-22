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
