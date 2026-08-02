import { listArticles } from "#/features/articles/articles.server";
import type {
	Activity,
	ContentSectionStats,
	DashboardContentItem,
	DashboardOverview,
	DashboardStats,
} from "#/features/dashboard/dashboard.types";
import { listImages } from "#/features/media/media.server";
import { listPosts } from "#/features/posts/posts.server";
import { listAssets } from "#/features/vault/vault.server";
import { readVaultConfig } from "#/features/vault/vault-config.server";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { mapWithConcurrency } from "#/lib/server/github-files.server";

/**
 * Reduces a content collection to the metrics every section shows. Keeping this
 * pure means articles, posts and vault types cannot drift apart.
 */
export function deriveSectionStats(
	section: Omit<
		ContentSectionStats,
		"total" | "published" | "drafts" | "lastUpdatedAt"
	>,
	items: readonly DashboardContentItem[],
): ContentSectionStats {
	const published = items.filter((item) => item.published).length;
	const lastUpdatedAt = items
		.map((item) => item.updatedAt)
		.filter(Boolean)
		.sort()
		.at(-1);

	return {
		...section,
		total: items.length,
		published,
		drafts: items.length - published,
		lastUpdatedAt,
	};
}

export function deriveDashboardStats({
	articles,
	posts,
	mediaFiles,
}: {
	articles: readonly DashboardContentItem[];
	posts: readonly DashboardContentItem[];
	mediaFiles: number;
}): DashboardStats {
	return {
		totalArticles: articles.length,
		publishedArticles: articles.filter((article) => article.published).length,
		draftArticles: articles.filter((article) => !article.published).length,
		totalPosts: posts.length,
		publishedPosts: posts.filter((post) => post.published).length,
		draftPosts: posts.filter((post) => !post.published).length,
		mediaFiles,
	};
}

const contentActivityConfig = {
	article: {
		label: "Article",
		path: "/cms/articles",
		createdType: "article_created",
		updatedType: "article_updated",
		publishedType: "article_published",
	},
	post: {
		label: "Post",
		path: "/cms/posts",
		createdType: "post_created",
		updatedType: "post_updated",
		publishedType: "post_published",
	},
} as const;

function deriveContentActivity(
	kind: keyof typeof contentActivityConfig,
	items: readonly DashboardContentItem[],
): Activity[] {
	const config = contentActivityConfig[kind];
	const activities: Activity[] = [];

	for (const item of items) {
		const link = `${config.path}/${item.id}`;

		activities.push({
			id: `${kind}-create-${item.id}`,
			type: config.createdType,
			title: `${config.label} created`,
			description: item.title,
			timestamp: item.createdAt,
			icon: "file",
			link,
		});

		if (item.updatedAt !== item.createdAt) {
			activities.push({
				id: `${kind}-update-${item.id}-${item.updatedAt}`,
				type: config.updatedType,
				title: `${config.label} updated`,
				description: item.title,
				timestamp: item.updatedAt,
				icon: "edit",
				link,
			});
		}

		if (item.published && item.publishedAt) {
			activities.push({
				id: `${kind}-pub-${item.id}`,
				type: config.publishedType,
				title: `${config.label} published`,
				description: item.title,
				timestamp: item.publishedAt,
				icon: "eye",
				link,
			});
		}
	}

	return activities;
}

export function deriveRecentActivity({
	articles,
	posts,
	mediaActivities = [],
	limit = 8,
}: {
	articles: readonly DashboardContentItem[];
	posts: readonly DashboardContentItem[];
	mediaActivities?: readonly Activity[];
	limit?: number;
}): Activity[] {
	return [
		...deriveContentActivity("article", articles),
		...deriveContentActivity("post", posts),
		...mediaActivities,
	]
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.filter((activity) => new Date(activity.timestamp).getTime() > 0)
		.slice(0, limit);
}

async function getRecentMediaActivity(): Promise<Activity[]> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const commitRes = await octokit.repos.listCommits({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: env.MEDIA_PATH,
			per_page: 5,
		});

		return commitRes.data.map((commit) => ({
			id: `image-commit-${commit.sha}`,
			type: "image_uploaded",
			title: "Images uploaded",
			description: commit.commit.message
				.replace("Upload image: ", "")
				.replace("Upload images: ", ""),
			timestamp: commit.commit.author?.date || "",
			icon: "image",
			link: "/cms/media",
		}));
	} catch {
		return [];
	}
}

/**
 * Vault types are listed a few at a time: each listing already fans out to read
 * its documents, so unbounded parallelism here would multiply into a burst
 * large enough to trip GitHub's secondary rate limits.
 */
const VAULT_SECTION_CONCURRENCY = 3;

async function loadVaultSections(): Promise<ContentSectionStats[]> {
	const configResult = await readVaultConfig();
	if (!configResult.success) {
		return [];
	}

	return mapWithConcurrency(
		configResult.data.config.assetTypes,
		VAULT_SECTION_CONCURRENCY,
		async (type) => {
			const result = await listAssets(type.id);

			return deriveSectionStats(
				{
					id: type.id,
					label: type.label,
					icon: type.icon,
					browseTo: "/cms/vault",
					createTo: "/cms/vault/new",
					search: { type: type.id },
				},
				result.success ? result.data : [],
			);
		},
	);
}

export async function loadDashboardOverview(
	limit = 8,
): Promise<DashboardOverview> {
	const [
		articlesResult,
		postsResult,
		imagesResult,
		mediaActivities,
		vaultSections,
	] = await Promise.all([
		listArticles(),
		listPosts(),
		listImages(),
		getRecentMediaActivity(),
		loadVaultSections(),
	]);
	const articles = articlesResult.success ? articlesResult.data : [];
	const posts = postsResult.success ? postsResult.data : [];
	const images = imagesResult.success ? imagesResult.data : [];

	return {
		stats: deriveDashboardStats({
			articles,
			posts,
			mediaFiles: images.length,
		}),
		sections: [
			deriveSectionStats(
				{
					id: "articles",
					label: "Articles",
					icon: "article",
					browseTo: "/cms/articles",
					createTo: "/cms/articles/new",
				},
				articles,
			),
			deriveSectionStats(
				{
					id: "posts",
					label: "Posts",
					icon: "post",
					browseTo: "/cms/posts",
					createTo: "/cms/posts/new",
				},
				posts,
			),
			...vaultSections,
		],
		activities: deriveRecentActivity({
			articles,
			posts,
			mediaActivities,
			limit,
		}),
	};
}
