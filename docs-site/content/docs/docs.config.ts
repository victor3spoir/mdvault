/**
 * Documentation site configuration.
 *
 * Lives next to the Markdown it orders, so an author who opens `content/docs`
 * finds the ordering rules in the same folder as the pages.
 *
 * Sections are declared here; **pages are discovered from the file tree**.
 * Listing pages here as well would create a second source of navigation truth,
 * and the two drift within a week.
 */

export type DocsSection = {
	/** Folder name under the content root. */
	id: string;
	/** Group header in the sidebar. */
	label: string;
	/** Icon key, resolved in `src/features/docs/components/docs-icon.tsx`. */
	icon?: string;
	order: number;
};

export type DocsLandingCard = {
	/** Slug of an existing page — the build fails if it does not resolve. */
	slug: string;
	icon?: string;
};

export type DocsConfig = {
	/** Product name shown in the header and in page titles. */
	siteName: string;
	title: string;
	description: string;
	contentRoot: string;
	/** Absolute URL of the product app, or `undefined` to hide the CTA. */
	appUrl?: string;
	sections: Array<DocsSection>;
	landing: {
		lede: string;
		groups: Array<{ label: string; cards: Array<DocsLandingCard> }>;
	};
	/** "Edit this page" target, or `undefined` to hide the link. */
	editUrl?: (slug: string) => string;
};

export const docsConfig: DocsConfig = {
	siteName: "MDVault",
	title: "Documentation",
	description:
		"Learn how to run MDVault — GitHub-powered Markdown content management, where the repository is the database.",
	contentRoot: "content/docs",
	appUrl: "https://mdvault-docs.vercel.app",

	sections: [
		{
			id: "getting-started",
			label: "Getting started",
			icon: "rocket",
			order: 10,
		},
		{ id: "features", label: "Features", icon: "stack", order: 20 },
		{ id: "guides", label: "Guides", icon: "map", order: 30 },
		{ id: "reference", label: "Reference", icon: "code", order: 40 },
		{ id: "architecture", label: "Architecture", icon: "blocks", order: 50 },
	],

	landing: {
		lede: "Write, organize and publish Markdown — with the images it uses — versioned in your own GitHub repository. No database, no lock-in, every change a commit.",
		groups: [
			{
				label: "Start here",
				cards: [{ slug: "overview", icon: "map" }],
			},
			{
				label: "Getting started",
				cards: [
					{ slug: "getting-started/installation", icon: "download" },
					{ slug: "getting-started/github-token", icon: "shield" },
					{ slug: "getting-started/configuration", icon: "settings" },
				],
			},
			{
				label: "Features",
				cards: [
					{ slug: "features/articles", icon: "file" },
					{ slug: "features/posts", icon: "message" },
					{ slug: "features/vault", icon: "stack" },
					{ slug: "features/media", icon: "image" },
					{ slug: "features/editor", icon: "pencil" },
				],
			},
			{
				label: "Guides",
				cards: [
					{ slug: "guides/consume-your-content", icon: "plug" },
					{ slug: "guides/fetch-articles", icon: "download" },
					{ slug: "guides/serve-private-images", icon: "image" },
					{ slug: "guides/deploy", icon: "cloud" },
					{ slug: "guides/develop", icon: "code" },
					{ slug: "guides/write-the-docs", icon: "book" },
				],
			},
			{
				label: "Reference",
				cards: [
					{ slug: "reference/environment", icon: "settings" },
					{ slug: "reference/repository-layout", icon: "folder" },
					{ slug: "reference/frontmatter", icon: "list" },
					{ slug: "reference/http-endpoints", icon: "globe" },
				],
			},
			{
				label: "Architecture",
				cards: [
					{ slug: "architecture/overview", icon: "blocks" },
					{ slug: "architecture/security", icon: "lock" },
				],
			},
		],
	},

	editUrl: (slug) =>
		`https://github.com/victor3spoir/mdvault/blob/main/docs-site/content/docs/${slug}.md`,
};
