import { z } from "zod";
import { LocaleSchema } from "#/features/shared/locales";

/** Shape every content kind (articles, posts, vault assets) satisfies. */
export interface FilterableContent {
	title: string;
	content: string;
	lang: string;
	createdAt: string;
	published: boolean;
	description?: string;
	tags?: string[];
	author?: string;
}

export type ContentStatusFilter = "all" | "published" | "draft";
export type ContentLangFilter = "all" | string;
export type ContentSortBy = "date" | "title";
export type ContentSortOrder = "asc" | "desc";

export interface ContentFilters {
	searchQuery: string;
	status: ContentStatusFilter;
	lang: ContentLangFilter;
	sortBy: ContentSortBy;
	sortOrder: ContentSortOrder;
	tags: string[];
}

const tagsSchema = z.preprocess((value) => {
	if (typeof value === "string") {
		return [value];
	}
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}
	return [];
}, z.array(z.string()).default([]));

/** Reusable search-param schema for content list routes. */
export const contentFiltersSchema = z.object({
	searchQuery: z.string().default(""),
	status: z.enum(["all", "published", "draft"]).default("all"),
	lang: z.union([z.literal("all"), LocaleSchema]).default("all"),
	sortBy: z.enum(["date", "title"]).default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	tags: tagsSchema,
});

export const DEFAULT_CONTENT_FILTERS: ContentFilters = {
	searchQuery: "",
	status: "all",
	lang: "all",
	sortBy: "date",
	sortOrder: "desc",
	tags: [],
};

function matchesSearch(item: FilterableContent, query: string) {
	if (!query) {
		return true;
	}

	return (
		item.title.toLowerCase().includes(query) ||
		item.description?.toLowerCase().includes(query) === true ||
		item.author?.toLowerCase().includes(query) === true ||
		item.content.toLowerCase().includes(query) ||
		item.tags?.some((tag) => tag.toLowerCase().includes(query)) === true
	);
}

export function filterAndSortContent<T extends FilterableContent>(
	items: readonly T[],
	filters: ContentFilters,
): T[] {
	const query = filters.searchQuery.trim().toLowerCase();
	const modifier = filters.sortOrder === "asc" ? 1 : -1;

	return items
		.filter((item) => {
			const statusOk =
				filters.status === "all" ||
				(filters.status === "published" ? item.published : !item.published);
			const langOk = filters.lang === "all" || item.lang === filters.lang;
			const tagsOk =
				filters.tags.length === 0 ||
				filters.tags.some((tag) => item.tags?.includes(tag));

			return matchesSearch(item, query) && statusOk && langOk && tagsOk;
		})
		.sort((a, b) => {
			if (filters.sortBy === "title") {
				return a.title.localeCompare(b.title) * modifier;
			}

			return (
				(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
				modifier
			);
		});
}

export function collectContentTags(items: readonly FilterableContent[]) {
	return Array.from(new Set(items.flatMap((item) => item.tags ?? []))).sort(
		(a, b) => a.localeCompare(b),
	);
}

export function hasActiveContentFilters(filters: ContentFilters) {
	return (
		filters.searchQuery.trim() !== "" ||
		filters.status !== "all" ||
		filters.lang !== "all" ||
		filters.tags.length > 0
	);
}
