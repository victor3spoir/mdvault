"use server";

import { listArticlesAction } from "@/features/articles/articles.actions";
import { listImagesAction } from "@/features/medias/medias.actions";
import type { Activity, DashboardStats } from "./dashboard.types";

export async function getDashboardStatsAction(): Promise<DashboardStats> {
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
  try {
    const [articlesResult, imagesResult] = await Promise.all([
      listArticlesAction(),
      listImagesAction(),
    ]);

    const articles = articlesResult.success ? articlesResult.data : [];
    const images = imagesResult.success ? imagesResult.data : [];

    const activities: Activity[] = [];

    // Add article activities
    articles.forEach((article) => {
      // Add article published activity
      if (article.published) {
        activities.push({
          id: `article-pub-${article.id}`,
          type: "article_published",
          title: "Article published",
          description: article.title,
          timestamp: article.updatedAt,
          icon: "eye",
        });
      }

      // Add article created activity
      activities.push({
        id: `article-create-${article.id}`,
        type: "article_created",
        title: "Article created",
        description: article.title,
        timestamp: article.createdAt,
        icon: "file",
      });
    });

    // Add image upload activities
    images.forEach((image) => {
      activities.push({
        id: `image-${image.id}`,
        type: "image_uploaded",
        title: "Image uploaded",
        description: image.name,
        timestamp: image.uploadedAt,
        icon: "image",
      });
    });

    // Sort by timestamp (newest first) and limit results
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}
