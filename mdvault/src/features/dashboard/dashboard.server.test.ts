import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Activity,
	DashboardContentItem,
} from "#/features/dashboard/dashboard.types";

const dependencies = vi.hoisted(() => ({
	listArticles: vi.fn(),
	listPosts: vi.fn(),
	listImages: vi.fn(),
	listCommits: vi.fn(),
	listAssets: vi.fn(),
	readVaultConfig: vi.fn(),
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

vi.mock("#/features/vault/vault.server", () => ({
	listAssets: dependencies.listAssets,
}));

vi.mock("#/features/vault/vault-config.server", () => ({
	readVaultConfig: dependencies.readVaultConfig,
}));

vi.mock("#/integrations/github/github-client.server", () => ({
	getGitHubClient: () => ({
		repos: { listCommits: dependencies.listCommits },
	}),
}));

vi.mock("#/integrations/github/github-env.server", () => ({
	getGitHubEnv: () => ({
		GITHUB_TOKEN: "test-token",
		GITHUB_OWNER: "test-owner",
		GITHUB_REPO: "test-repo",
		ARTICLES_PATH: "articles",
		POSTS_PATH: "posts",
		MEDIA_PATH: "media",
	}),
}));

import {
	deriveDashboardStats,
	deriveRecentActivity,
	deriveSectionStats,
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

describe("content section stats", () => {
	const section = {
		id: "articles",
		label: "Articles",
		icon: "article",
		browseTo: "/cms/articles",
		createTo: "/cms/articles/new",
	};

	it("splits a collection into total, published and drafts", () => {
		expect(
			deriveSectionStats(section, [
				contentItem({ id: "a", published: true }),
				contentItem({ id: "b" }),
				contentItem({ id: "c" }),
			]),
		).toMatchObject({ total: 3, published: 1, drafts: 2 });
	});

	it("reports the most recent update across the section", () => {
		expect(
			deriveSectionStats(section, [
				contentItem({ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" }),
				contentItem({ id: "b", updatedAt: "2026-03-09T00:00:00.000Z" }),
				contentItem({ id: "c", updatedAt: "2026-02-01T00:00:00.000Z" }),
			]).lastUpdatedAt,
		).toBe("2026-03-09T00:00:00.000Z");
	});

	it("reports an empty section without a last update", () => {
		expect(deriveSectionStats(section, [])).toMatchObject({
			total: 0,
			published: 0,
			drafts: 0,
			lastUpdatedAt: undefined,
		});
	});
});

describe("dashboard overview", () => {
	beforeEach(() => {
		dependencies.listArticles.mockReset();
		dependencies.listPosts.mockReset();
		dependencies.listImages.mockReset();
		dependencies.listCommits.mockReset();
		dependencies.listAssets.mockReset();
		dependencies.readVaultConfig.mockReset();
		dependencies.readVaultConfig.mockResolvedValue({
			success: true,
			data: { config: { version: 1, assetTypes: [] }, sha: null },
		});
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
		dependencies.listCommits.mockResolvedValue({
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
		expect(dependencies.listCommits).toHaveBeenCalledOnce();
		expect(overview.sections.map((section) => section.id)).toEqual([
			"articles",
			"posts",
		]);
		expect(overview.sections[0]).toMatchObject({
			label: "Articles",
			total: 1,
			published: 0,
			drafts: 1,
			browseTo: "/cms/articles",
		});
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

	it("adds a section for each vault type", async () => {
		dependencies.listArticles.mockResolvedValue({ success: true, data: [] });
		dependencies.listPosts.mockResolvedValue({ success: true, data: [] });
		dependencies.listImages.mockResolvedValue({ success: true, data: [] });
		dependencies.listCommits.mockResolvedValue({ data: [] });
		dependencies.readVaultConfig.mockResolvedValue({
			success: true,
			data: {
				config: {
					version: 1,
					assetTypes: [
						{
							id: "projects",
							label: "Projects",
							icon: "flask",
							editor: "rich",
						},
						{ id: "docs", label: "Docs", icon: "book", editor: "plain" },
					],
				},
				sha: "config-sha",
			},
		});
		dependencies.listAssets.mockImplementation(async (type: string) => ({
			success: true,
			data:
				type === "projects"
					? [
							contentItem({ id: "p-1", published: true }),
							contentItem({ id: "p-2" }),
						]
					: [],
		}));

		const overview = await loadDashboardOverview();

		expect(overview.sections.map((section) => section.id)).toEqual([
			"articles",
			"posts",
			"projects",
			"docs",
		]);
		expect(overview.sections[2]).toMatchObject({
			label: "Projects",
			icon: "flask",
			total: 2,
			published: 1,
			drafts: 1,
			browseTo: "/cms/vault",
			search: { type: "projects" },
		});
		expect(overview.sections[3]).toMatchObject({ label: "Docs", total: 0 });
	});

	it("still renders built-in sections when the vault config is unreadable", async () => {
		dependencies.listArticles.mockResolvedValue({ success: true, data: [] });
		dependencies.listPosts.mockResolvedValue({ success: true, data: [] });
		dependencies.listImages.mockResolvedValue({ success: true, data: [] });
		dependencies.listCommits.mockResolvedValue({ data: [] });
		dependencies.readVaultConfig.mockResolvedValue({
			success: false,
			error: "boom",
		});

		const overview = await loadDashboardOverview();

		expect(overview.sections.map((section) => section.id)).toEqual([
			"articles",
			"posts",
		]);
	});
});
