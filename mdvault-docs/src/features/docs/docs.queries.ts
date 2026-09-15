import { queryOptions } from "@tanstack/react-query";
import {
	getDocsNav,
	getDocsPage,
	getDocsSearchIndex,
} from "#/features/docs/docs.functions";

/**
 * Docs content only changes when the app is redeployed, so everything here is
 * cached for the lifetime of the tab. Re-fetching a page the reader already has
 * would spend a round trip to get a byte-identical answer.
 */
const FOREVER = {
	staleTime: Number.POSITIVE_INFINITY,
	gcTime: Number.POSITIVE_INFINITY,
};

export const docsKeys = {
	all: ["docs"] as const,
	nav: () => [...docsKeys.all, "nav"] as const,
	page: (slug: string) => [...docsKeys.all, "page", slug] as const,
	search: () => [...docsKeys.all, "search"] as const,
};

export const docsNavQueryOptions = () =>
	queryOptions({
		queryKey: docsKeys.nav(),
		queryFn: () => getDocsNav(),
		...FOREVER,
	});

export const docsPageQueryOptions = (slug: string) =>
	queryOptions({
		queryKey: docsKeys.page(slug),
		queryFn: () => getDocsPage({ data: { slug } }),
		...FOREVER,
	});

/** Fetched on first search, not on page load: it is the largest payload. */
export const docsSearchQueryOptions = () =>
	queryOptions({
		queryKey: docsKeys.search(),
		queryFn: () => getDocsSearchIndex(),
		...FOREVER,
	});
