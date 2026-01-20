"use server";

import { listArticlesAction } from "@/features/articles/articles.actions";
import { listImagesAction } from "@/features/medias/medias.actions";

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  mediaFiles: number;
}

export interface Activity {
  id: string;
  type: "post_created" | "post_published" | "image_uploaded";
  title: string;
  description: string;
  timestamp: string;
  icon: "file" | "image" | "eye";
}

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  try {
    const [posts, images] = await Promise.all([
      listArticlesAction(),
      listImagesAction(),
    ]);

    const publishedCount = posts.filter((article) => article.published).length;
    const draftCount = posts.filter((article) => !article.published).length;

    return {
      totalPosts: posts.length,
      publishedPosts: publishedCount,
      draftPosts: draftCount,
      mediaFiles: images.length,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      mediaFiles: 0,
    };
  }
}

export async function getRecentActivityAction(
  limit: number = 8,
): Promise<Activity[]> {
  try {
    const [posts, images] = await Promise.all([
      listArticlesAction(),
      listImagesAction(),
    ]);

    const activities: Activity[] = [];

    // Add article activities
    posts.forEach((article) => {
      // Add article published activity
      if (article.published) {
        activities.push({
          id: `article-pub-${article.slug}`,
          type: "post_published",
          title: "Article published",
          description: article.title,
          timestamp: article.updatedAt,
          icon: "eye",
        });
      }

      // Add article created activity
      activities.push({
        id: `article-create-${article.slug}`,
        type: "post_created",
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
