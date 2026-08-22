import { describe, expect, it } from "vitest";
import {
	type ContentFilters,
	collectContentTags,
	contentFiltersSchema,
	DEFAULT_CONTENT_FILTERS,
	type FilterableContent,
	filterAndSortContent,
	hasActiveContentFilters,
} from "#/features/shared/content-filters";

const defaultFilters: ContentFilters = DEFAULT_CONTENT_FILTERS;

function createItem(
	overrides: Partial<FilterableContent> & { id: string },
): FilterableContent & { id: string } {
	return {
		title: "Item",
		content: "Item content",
		lang: "en",
		createdAt: "2026-01-01T00:00:00.000Z",
		published: false,
		...overrides,
	};
}

const items = [
	createItem({
		id: "release-notes",
		title: "Release notes",
		content: "A short product update",
		author: "Victor",
		published: true,
		tags: ["changelog"],
		createdAt: "2026-03-01T00:00:00.000Z",
	}),
	createItem({
		id: "guide-fr",
		title: "Guide pratique",
		description: "Conseils pour les équipes",
		content: "Contenu du guide",
		lang: "fr",
		tags: ["guide", "changelog"],
		createdAt: "2026-02-01T00:00:00.000Z",
	}),
	createItem({
		id: "announcement",
		title: "Announcement",
		content: "A major launch",
		published: true,
		createdAt: "2026-01-01T00:00:00.000Z",
	}),
];

describe("filterAndSortContent", () => {
	it.each([
		["release", "release-notes"],
		["PRODUCT UPDATE", "release-notes"],
		["victor", "release-notes"],
		["conseils", "guide-fr"],
		["guide", "guide-fr"],
	])("searches normalized fields with %s", (searchQuery, expectedId) => {
		const result = filterAndSortContent(items, {
			...defaultFilters,
			searchQuery,
		});

		expect(result.map((item) => item.id)).toEqual([expectedId]);
	});

	it("combines status and language filters", () => {
		const result = filterAndSortContent(items, {
			...defaultFilters,
			status: "draft",
			lang: "fr",
		});

		expect(result.map((item) => item.id)).toEqual(["guide-fr"]);
	});

	it("filters by tags", () => {
		expect(
			filterAndSortContent(items, {
				...defaultFilters,
				tags: ["changelog"],
			}).map((item) => item.id),
		).toEqual(["release-notes", "guide-fr"]);

		expect(
			filterAndSortContent(items, { ...defaultFilters, tags: ["guide"] }).map(
				(item) => item.id,
			),
		).toEqual(["guide-fr"]);
	});

	it("sorts by date in either direction", () => {
		expect(
			filterAndSortContent(items, defaultFilters).map((item) => item.id),
		).toEqual(["release-notes", "guide-fr", "announcement"]);
		expect(
			filterAndSortContent(items, {
				...defaultFilters,
				sortOrder: "asc",
			}).map((item) => item.id),
		).toEqual(["announcement", "guide-fr", "release-notes"]);
	});

	it("sorts by title in either direction without mutating the source", () => {
		const sourceOrder = items.map((item) => item.id);
		const ascending = filterAndSortContent(items, {
			...defaultFilters,
			sortBy: "title",
			sortOrder: "asc",
		});
		const descending = filterAndSortContent(items, {
			...defaultFilters,
			sortBy: "title",
			sortOrder: "desc",
		});

		expect(ascending.map((item) => item.id)).toEqual([
			"announcement",
			"guide-fr",
			"release-notes",
		]);
		expect(descending.map((item) => item.id)).toEqual([
			"release-notes",
			"guide-fr",
			"announcement",
		]);
		expect(items.map((item) => item.id)).toEqual(sourceOrder);
	});
});

describe("collectContentTags", () => {
	it("returns unique sorted tags", () => {
		expect(collectContentTags(items)).toEqual(["changelog", "guide"]);
	});

	it("handles items without tags", () => {
		expect(collectContentTags([createItem({ id: "a" })])).toEqual([]);
	});
});

describe("contentFiltersSchema", () => {
	it("applies defaults for an empty search", () => {
		expect(contentFiltersSchema.parse({})).toEqual(DEFAULT_CONTENT_FILTERS);
	});

	it("normalizes a single tag string into an array", () => {
		expect(contentFiltersSchema.parse({ tags: "guide" }).tags).toEqual([
			"guide",
		]);
	});

	it("accepts and canonicalizes configured locale filters", () => {
		expect(contentFiltersSchema.parse({ lang: "pt-br" }).lang).toBe("pt-BR");
	});
});

describe("hasActiveContentFilters", () => {
	it("is false for defaults and true once a filter is set", () => {
		expect(hasActiveContentFilters(DEFAULT_CONTENT_FILTERS)).toBe(false);
		expect(
			hasActiveContentFilters({ ...defaultFilters, status: "draft" }),
		).toBe(true);
		expect(
			hasActiveContentFilters({ ...defaultFilters, searchQuery: "x" }),
		).toBe(true);
	});
});
