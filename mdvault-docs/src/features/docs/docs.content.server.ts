import { defaultHighlighter } from "@tanstack/highlight";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import type { BlockNode, MarkdownDocument } from "@tanstack/markdown";
import { parseMarkdown } from "@tanstack/markdown";
import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { parseFrontmatter } from "#/features/docs/docs.frontmatter";
import { blocksToText, splitByHeadings } from "#/features/docs/docs.text";
import type {
	DocsNav,
	DocsNavLink,
	DocsPage,
	DocsPageMeta,
	DocsSearchRecord,
} from "#/features/docs/docs.types";
import { docsConfig } from "../../../content/docs/docs.config";

/**
 * Server-side content layer.
 *
 * Markdown is pulled in at **build time** with `import.meta.glob(..., '?raw')`
 * rather than read from disk at request time. Three consequences, all of them
 * the reason for the choice:
 *
 * 1. The deployed bundle carries its own content — no `content/` folder to copy
 *    next to the server, which is what usually breaks a docs site on the first
 *    deploy.
 * 2. A slug can only ever resolve to a file that existed at build time, so
 *    there is no path-traversal surface to defend.
 * 3. Vite invalidates the module when a `.md` file changes, so editing a page
 *    in development reloads it.
 *
 * This module must stay server-only: it pulls in the parser and the
 * highlighter, neither of which the browser needs.
 */

const RAW_PAGES = import.meta.glob("../../../content/docs/**/*.md", {
	eager: true,
	query: "?raw",
	import: "default",
}) as Record<string, string>;

const highlighter = createTanStackMarkdownHighlighter(defaultHighlighter);

const PARSE_OPTIONS = {
	frontmatter: true,
	headingIds: true,
	extensions: docsMarkdownExtensions({ collectHeadings: true }),
};

/**
 * `../../content/docs/features/authentication.md` → `features/authentication`
 *
 * `index.md` names the folder that contains it, and the root `index.md` maps to
 * the empty slug — the landing route owns that URL, so the file is never linked
 * as a page of its own.
 */
function toSlug(path: string): string {
	return path
		.replace(/^.*\/content\/docs\//, "")
		.replace(/\.md$/, "")
		.replace(/(^|\/)index$/, "");
}

function toSection(slug: string): string {
	const separator = slug.lastIndexOf("/");
	return separator === -1 ? "" : slug.slice(0, separator);
}

/** Parsed once per process; the content cannot change without a new build. */
let pageCache: Map<string, DocsPage> | undefined;

function allPages(): Map<string, DocsPage> {
	if (pageCache) return pageCache;

	const pages = new Map<string, DocsPage>();

	for (const [path, source] of Object.entries(RAW_PAGES)) {
		const slug = toSlug(path);
		const document = parseMarkdown(source, PARSE_OPTIONS);
		const frontmatter = parseFrontmatter(document.frontmatter, slug);

		pages.set(slug, {
			slug,
			section: toSection(slug),
			frontmatter,
			document,
			headings: (document.headings ?? []).filter(
				(heading) => heading.level > 1 && heading.level < 4,
			),
			highlighted: highlightCodeBlocks(document.children),
			source,
		});
	}

	pageCache = pages;
	return pages;
}

/**
 * Pre-renders every code block, keyed by language and source.
 *
 * The highlighter is a function, so it cannot cross the SSR boundary with the
 * parsed tree. Shipping it to the browser to redo work the server already did
 * is exactly what this pipeline exists to avoid, so the output travels instead
 * and the client highlighter is a lookup (see `docs.highlight.ts`).
 */
function highlightCodeBlocks(nodes: Array<BlockNode>): Record<string, string> {
	const rendered: Record<string, string> = {};

	const walk = (children: Array<BlockNode>) => {
		for (const node of children) {
			if (node.type === "code") {
				const lang = node.lang ?? "plaintext";
				rendered[`${lang}\u0000${node.value}`] = highlighter(node.value, lang, {
					...(node.highlightLines
						? { highlightLines: node.highlightLines }
						: {}),
				});
				continue;
			}

			if (node.type === "list") {
				for (const item of node.items) walk(item.children);
				continue;
			}

			if (
				node.type === "blockquote" ||
				node.type === "callout" ||
				node.type === "component"
			) {
				walk(node.children);
			}
		}
	};

	walk(nodes);
	return rendered;
}

export function getPage(slug: string): DocsPage | undefined {
	return allPages().get(slug);
}

export function listPages(): Array<DocsPageMeta> {
	return [...allPages().values()]
		.filter((page) => !page.frontmatter.draft)
		.map((page) => ({
			slug: page.slug,
			section: page.section,
			file: `content/docs/${page.slug}.md`,
			frontmatter: page.frontmatter,
		}));
}

/**
 * Builds the sidebar from the file tree plus frontmatter.
 *
 * Order inside a section: explicit `order`, then title. Order of sections comes
 * from `docs.config.ts`. Nothing here is hand-maintained twice.
 */
export function getNav(): DocsNav {
	const pages = listPages();

	const toLink = (page: DocsPageMeta): DocsNavLink => ({
		slug: page.slug,
		title: page.frontmatter.title,
		description: page.frontmatter.description,
	});

	const byOrderThenTitle = (a: DocsPageMeta, b: DocsPageMeta) => {
		const left = a.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
		const right = b.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
		return left === right
			? a.frontmatter.title.localeCompare(b.frontmatter.title)
			: left - right;
	};

	const top = pages
		.filter((page) => page.section === "" && page.slug !== "")
		.sort(byOrderThenTitle)
		.map(toLink);

	const groups = [...docsConfig.sections]
		.sort((a, b) => a.order - b.order)
		.map((section) => ({
			id: section.id,
			label: section.label,
			...(section.icon ? { icon: section.icon } : {}),
			links: pages
				.filter((page) => page.section === section.id)
				.sort(byOrderThenTitle)
				.map(toLink),
		}))
		.filter((group) => group.links.length > 0);

	return {
		top,
		groups,
		order: [...top, ...groups.flatMap((group) => group.links)],
	};
}

/** One record per heading, so a hit lands on the paragraph and not the page. */
export function getSearchIndex(): Array<DocsSearchRecord> {
	const records: Array<DocsSearchRecord> = [];

	for (const page of allPages().values()) {
		if (page.frontmatter.draft) continue;

		const keywords = page.frontmatter.keywords?.join(" ") ?? "";

		for (const slice of splitByHeadings(page.document.children)) {
			const content = blocksToText(slice.body);
			if (!content && !slice.heading) continue;

			records.push({
				id: `${page.slug}#${slice.headingId}`,
				slug: page.slug,
				title: page.frontmatter.title,
				heading: slice.heading,
				headingId: slice.headingId,
				section: page.section,
				content: slice.headingId
					? content
					: `${page.frontmatter.description} ${keywords} ${content}`.trim(),
			});
		}
	}

	return records;
}

/** Reading-order neighbours, for the pager at the bottom of every page. */
export function getNeighbours(slug: string): {
	previous?: DocsNavLink;
	next?: DocsNavLink;
} {
	const { order } = getNav();
	const index = order.findIndex((link) => link.slug === slug);

	if (index === -1) return {};

	return {
		...(index > 0 ? { previous: order[index - 1] as DocsNavLink } : {}),
		...(index < order.length - 1
			? { next: order[index + 1] as DocsNavLink }
			: {}),
	};
}

export type { MarkdownDocument };
