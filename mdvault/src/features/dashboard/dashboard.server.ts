import { listArticles } from "#/features/articles/articles.server";
import type {
	Activity,
	DashboardContentItem,
	DashboardOverview,
	DashboardStats,
} from "#/features/dashboard/dashboard.types";
import { listImages } from "#/features/media/media.server";
import { listPosts } from "#/features/posts/posts.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { runGitHubRead } from "#/integrations/github/github-read.server";

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
		const commitRes = await runGitHubRead(async (octokit) => {
			const env = getGitHubEnv();
			return octokit.repos.listCommits({
				owner: env.GITHUB_OWNER,
				repo: env.GITHUB_REPO,
				path: env.MEDIA_PATH,
				per_page: 5,
			});
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

export async function loadDashboardOverview(
	limit = 8,
): Promise<DashboardOverview> {
	const [articlesResult, postsResult, imagesResult, mediaActivities] =
		await Promise.all([
			listArticles(),
			listPosts(),
			listImages(),
			getRecentMediaActivity(),
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
		activities: deriveRecentActivity({
			articles,
			posts,
			mediaActivities,
			limit,
		}),
	};
}
