import { describe, expect, it } from "vitest";
import type { Post } from "./posts.types";
import { filterAndSortPosts, type PostListFilters } from "./posts.utils";

const defaultFilters: PostListFilters = {
	searchQuery: "",
	status: "all",
	lang: "all",
	sortBy: "date",
	sortOrder: "desc",
};

function createPost(overrides: Partial<Post>): Post {
	return {
		id: "post",
		title: "Post",
		content: "Post content",
		lang: "en",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		published: false,
		path: "posts/post.mdx",
		sha: "sha",
		...overrides,
	};
}

const posts = [
	createPost({
		id: "release-notes",
		title: "Release notes",
		content: "A short product update",
		author: "Victor",
		published: true,
		createdAt: "2026-03-01T00:00:00.000Z",
	}),
	createPost({
		id: "guide-fr",
		title: "Guide pratique",
		content: "Conseils pour les équipes",
		lang: "fr",
		createdAt: "2026-02-01T00:00:00.000Z",
	}),
	createPost({
		id: "announcement",
		title: "Announcement",
		content: "A major launch",
		published: true,
		createdAt: "2026-01-01T00:00:00.000Z",
	}),
];

describe("filterAndSortPosts", () => {
	it.each([
		["release", "release-notes"],
		["PRODUCT UPDATE", "release-notes"],
		["victor", "release-notes"],
	])("searches normalized post fields with %s", (searchQuery, expectedId) => {
		const result = filterAndSortPosts(posts, {
			...defaultFilters,
			searchQuery,
		});

		expect(result.map((post) => post.id)).toEqual([expectedId]);
	});

	it("combines status and language filters", () => {
		const result = filterAndSortPosts(posts, {
			...defaultFilters,
			status: "draft",
			lang: "fr",
		});

		expect(result.map((post) => post.id)).toEqual(["guide-fr"]);
	});

	it("sorts by date in either direction", () => {
		expect(
			filterAndSortPosts(posts, defaultFilters).map((post) => post.id),
		).toEqual(["release-notes", "guide-fr", "announcement"]);
		expect(
			filterAndSortPosts(posts, {
				...defaultFilters,
				sortOrder: "asc",
			}).map((post) => post.id),
		).toEqual(["announcement", "guide-fr", "release-notes"]);
	});

	it("sorts by title in either direction without mutating the source", () => {
		const sourceOrder = posts.map((post) => post.id);
		const ascending = filterAndSortPosts(posts, {
			...defaultFilters,
			sortBy: "title",
			sortOrder: "asc",
		});
		const descending = filterAndSortPosts(posts, {
			...defaultFilters,
			sortBy: "title",
			sortOrder: "desc",
		});

		expect(ascending.map((post) => post.id)).toEqual([
			"announcement",
			"guide-fr",
			"release-notes",
		]);
		expect(descending.map((post) => post.id)).toEqual([
			"release-notes",
			"guide-fr",
			"announcement",
		]);
		expect(posts.map((post) => post.id)).toEqual(sourceOrder);
	});
});
