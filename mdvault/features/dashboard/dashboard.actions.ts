"use server";

import { listArticlesAction } from "@/features/articles/articles.actions";
import { listImagesAction } from "@/features/medias/medias.actions";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import { cacheTag } from "next/cache";
import type { Activity, DashboardStats } from "./dashboard.types";

export async function getDashboardStatsAction(): Promise<DashboardStats> {
	"use cache";
	cacheTag("articles", "medias");
	try {
		const [articlesResult, imagesResult] = await Promise.all([
			listArticlesAction(),
			listImagesAction(),
		]);

		const articles = articlesResult.success ? articlesResult.data : [];
		const images = imagesResult.success ? imagesResult.data : [];

		const publishedCount = articles.filter(
			(article) => article.published,
		).length;
		const draftCount = articles.filter((article) => !article.published).length;

		return {
			totalArticles: articles.length,
			publishedArticles: publishedCount,
			draftArticles: draftCount,
			mediaFiles: images.length,
		};
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		return {
			totalArticles: 0,
			publishedArticles: 0,
			draftArticles: 0,
			mediaFiles: 0,
		};
	}
}

export async function getRecentActivityAction(
	limit: number = 8,
): Promise<Activity[]> {
	"use cache";
	cacheTag("articles", "medias");
	try {
		const articlesResult = await listArticlesAction();
		const articles = articlesResult.success ? articlesResult.data : [];

		const activities: Activity[] = [];

		// Add article activities (from frontmatter metadata)
		articles.forEach((article) => {
			// Created
			activities.push({
				id: `article-create-${article.id}`,
				type: "article_created",
				title: "Article created",
				description: article.title,
				timestamp: article.createdAt,
				icon: "file",
				link: `/cms/articles/${article.id}/edit`,
			});

			// Updated
			if (article.updatedAt !== article.createdAt) {
				activities.push({
					id: `article-update-${article.id}-${article.updatedAt}`,
					type: "article_updated",
					title: "Article updated",
					description: article.title,
					timestamp: article.updatedAt,
					icon: "edit",
					link: `/cms/articles/${article.id}/edit`,
				});
			}

			// Published
			if (article.published && article.publishedAt) {
				activities.push({
					id: `article-pub-${article.id}`,
					type: "article_published",
					title: "Article published",
					description: article.title,
					timestamp: article.publishedAt,
					icon: "eye",
					link: `/cms/articles/${article.id}/edit`,
				});
			}
		});

		// Add image upload activities (from Git commits for accuracy)
		try {
			const commitRes = await octokit.repos.listCommits({
				owner: githubRepoInfo.owner,
				repo: githubRepoInfo.repo,
				path: githubRepoInfo.MEDIA_PATH,
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
		} catch (err) {
			console.warn("Could not fetch image commits for activity:", err);
		}

		// Sort by timestamp (newest first) and limit results
		return activities
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.filter((a) => new Date(a.timestamp).getTime() > 0) // Ensure valid dates
			.slice(0, limit);
	} catch (error) {
		console.error("Error fetching recent activity:", error);
		return [];
	}
}
