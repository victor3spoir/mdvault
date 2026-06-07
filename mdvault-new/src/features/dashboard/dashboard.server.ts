import {
	getArticleStats,
	listArticles,
} from "#/features/articles/articles.server";
import type {
	Activity,
	DashboardStats,
} from "#/features/dashboard/dashboard.types";
import { listImages } from "#/features/media/media.server";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";

export async function getDashboardStats(): Promise<DashboardStats> {
	const [articleStats, imagesResult] = await Promise.all([
		getArticleStats(),
		listImages(),
	]);
	const images = imagesResult.success ? imagesResult.data : [];

	return {
		totalArticles: articleStats.totalArticles,
		publishedArticles: articleStats.publishedArticles,
		draftArticles: articleStats.draftArticles,
		mediaFiles: images.length,
	};
}

export async function getRecentActivity(limit = 8): Promise<Activity[]> {
	const articlesResult = await listArticles();
	const articles = articlesResult.success ? articlesResult.data : [];
	const activities: Activity[] = [];

	for (const article of articles) {
		activities.push({
			id: `article-create-${article.id}`,
			type: "article_created",
			title: "Article created",
			description: article.title,
			timestamp: article.createdAt,
			icon: "file",
			link: `/cms/articles/${article.id}`,
		});

		if (article.updatedAt !== article.createdAt) {
			activities.push({
				id: `article-update-${article.id}-${article.updatedAt}`,
				type: "article_updated",
				title: "Article updated",
				description: article.title,
				timestamp: article.updatedAt,
				icon: "edit",
				link: `/cms/articles/${article.id}`,
			});
		}

		if (article.published && article.publishedAt) {
			activities.push({
				id: `article-pub-${article.id}`,
				type: "article_published",
				title: "Article published",
				description: article.title,
				timestamp: article.publishedAt,
				icon: "eye",
				link: `/cms/articles/${article.id}`,
			});
		}
	}

	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const commitRes = await octokit.repos.listCommits({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: env.MEDIA_PATH,
			per_page: 5,
		});

		for (const commit of commitRes.data) {
			activities.push({
				id: `image-commit-${commit.sha}`,
				type: "image_uploaded",
				title: "Images uploaded",
				description: commit.commit.message
					.replace("Upload image: ", "")
					.replace("Upload images: ", ""),
				timestamp: commit.commit.author?.date || "",
				icon: "image",
				link: "/cms/media",
			});
		}
	} catch {
		// Ignore media commit history failures for dashboard rendering.
	}

	return activities
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.filter((activity) => new Date(activity.timestamp).getTime() > 0)
		.slice(0, limit);
}
