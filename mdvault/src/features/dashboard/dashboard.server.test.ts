import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Activity,
	DashboardContentItem,
} from "#/features/dashboard/dashboard.types";

const dependencies = vi.hoisted(() => ({
	listArticles: vi.fn(),
	listPosts: vi.fn(),
	listImages: vi.fn(),
	runGitHubRead: vi.fn(),
}));

vi.mock("#/features/articles/articles.server", () => ({
	listArticles: dependencies.listArticles,
}));

vi.mock("#/features/posts/posts.server", () => ({
	listPosts: dependencies.listPosts,
}));

vi.mock("#/features/media/media.server", () => ({
	listImages: dependencies.listImages,
}));

vi.mock("#/integrations/github/github-read.server", () => ({
	runGitHubRead: dependencies.runGitHubRead,
}));

import {
	deriveDashboardStats,
	deriveRecentActivity,
	loadDashboardOverview,
} from "./dashboard.server";

function contentItem(
	overrides: Partial<DashboardContentItem> = {},
): DashboardContentItem {
	return {
		id: "content-id",
		title: "Content title",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		published: false,
		...overrides,
	};
}

describe("dashboard derivation", () => {
	it("derives article, post, and media stats", () => {
		const stats = deriveDashboardStats({
			articles: [
				contentItem({ id: "article-1", published: true }),
				contentItem({ id: "article-2" }),
			],
			posts: [
				contentItem({ id: "post-1", published: true }),
				contentItem({ id: "post-2", published: true }),
				contentItem({ id: "post-3" }),
			],
			mediaFiles: 4,
		});

		expect(stats).toEqual({
			totalArticles: 2,
			publishedArticles: 1,
			draftArticles: 1,
			totalPosts: 3,
			publishedPosts: 2,
			draftPosts: 1,
			mediaFiles: 4,
		});
	});

	it("derives created, updated, and published post activity", () => {
		const activities = deriveRecentActivity({
			articles: [],
			posts: [
				contentItem({
					id: "post-1",
					title: "Phase 3 update",
					updatedAt: "2026-01-02T00:00:00.000Z",
					publishedAt: "2026-01-03T00:00:00.000Z",
					published: true,
				}),
			],
		});

		expect(
			activities.map(({ type, title, description, link }) => ({
				type,
				title,
				description,
				link,
			})),
		).toEqual([
			{
				type: "post_published",
				title: "Post published",
				description: "Phase 3 update",
				link: "/cms/posts/post-1",
			},
			{
				type: "post_updated",
				title: "Post updated",
				description: "Phase 3 update",
				link: "/cms/posts/post-1",
			},
			{
				type: "post_created",
				title: "Post created",
				description: "Phase 3 update",
				link: "/cms/posts/post-1",
			},
		]);
	});

	it("merges, sorts, filters, and limits content and media activity", () => {
		const mediaActivity: Activity = {
			id: "image-commit-1",
			type: "image_uploaded",
			title: "Images uploaded",
			description: "cover.png",
			timestamp: "2026-01-04T00:00:00.000Z",
			icon: "image",
			link: "/cms/media",
		};
		const invalidMediaActivity: Activity = {
			...mediaActivity,
			id: "image-commit-invalid",
			timestamp: "",
		};

		const activities = deriveRecentActivity({
			articles: [contentItem({ id: "article-1" })],
			posts: [contentItem({ id: "post-1" })],
			mediaActivities: [mediaActivity, invalidMediaActivity],
			limit: 2,
		});

		expect(activities.map((activity) => activity.id)).toEqual([
			"image-commit-1",
			"article-create-article-1",
		]);
	});
});

describe("dashboard overview", () => {
	beforeEach(() => {
		dependencies.listArticles.mockReset();
		dependencies.listPosts.mockReset();
		dependencies.listImages.mockReset();
		dependencies.runGitHubRead.mockReset();
	});

	it("loads each content list once and preserves media data", async () => {
		dependencies.listArticles.mockResolvedValue({
			success: true,
			data: [contentItem({ id: "article-1" })],
		});
		dependencies.listPosts.mockResolvedValue({
			success: true,
			data: [contentItem({ id: "post-1", published: true })],
		});
		dependencies.listImages.mockResolvedValue({
			success: true,
			data: [{ id: "image-1" }, { id: "image-2" }],
		});
		dependencies.runGitHubRead.mockResolvedValue({
			data: [
				{
					sha: "media-sha",
					commit: {
						message: "Upload image: cover.png",
						author: { date: "2026-01-04T00:00:00.000Z" },
					},
				},
			],
		});

		const overview = await loadDashboardOverview();

		expect(dependencies.listArticles).toHaveBeenCalledOnce();
		expect(dependencies.listPosts).toHaveBeenCalledOnce();
		expect(dependencies.listImages).toHaveBeenCalledOnce();
		expect(dependencies.runGitHubRead).toHaveBeenCalledOnce();
		expect(overview.stats).toMatchObject({
			totalPosts: 1,
			publishedPosts: 1,
			draftPosts: 0,
			mediaFiles: 2,
		});
		expect(overview.activities).toContainEqual({
			id: "image-commit-media-sha",
			type: "image_uploaded",
			title: "Images uploaded",
			description: "cover.png",
			timestamp: "2026-01-04T00:00:00.000Z",
			icon: "image",
			link: "/cms/media",
		});
	});
});
