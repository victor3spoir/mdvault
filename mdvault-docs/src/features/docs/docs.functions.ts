import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as content from "#/features/docs/docs.content.server";

/**
 * Docs RPC.
 *
 * The docs are public — no session guard here, deliberately. Everything these
 * handlers return is already published on the site.
 *
 * Parsing and highlighting happen inside these handlers, so the parser, the
 * highlighter and the raw Markdown never reach the client bundle.
 */

const SlugSchema = z.object({ slug: z.string().max(200) });

export const getDocsNav = createServerFn({ method: "GET" }).handler(() =>
	content.getNav(),
);

export const getDocsPage = createServerFn({ method: "GET" })
	.validator(SlugSchema)
	.handler(({ data }) => {
		const page = content.getPage(data.slug);

		if (!page) throw notFound();

		const { previous, next } = content.getNeighbours(data.slug);

		return {
			slug: page.slug,
			frontmatter: page.frontmatter,
			document: page.document,
			headings: page.headings,
			highlighted: page.highlighted,
			source: page.source,
			...(previous ? { previous } : {}),
			...(next ? { next } : {}),
		};
	});

export const getDocsSearchIndex = createServerFn({ method: "GET" }).handler(
	() => content.getSearchIndex(),
);

export type DocsNavPayload = Awaited<ReturnType<typeof getDocsNav>>;
export type DocsPagePayload = Awaited<ReturnType<typeof getDocsPage>>;
export type DocsSearchIndex = Awaited<ReturnType<typeof getDocsSearchIndex>>;
