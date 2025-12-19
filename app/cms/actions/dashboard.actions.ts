"use server";

import { listImagesAction } from "@/features/medias/medias.actions";
import { listPostsAction } from "@/features/posts/posts.actions";

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
      listPostsAction(),
      listImagesAction(),
    ]);

    const publishedCount = posts.filter((post) => post.published).length;
    const draftCount = posts.filter((post) => !post.published).length;

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
      listPostsAction(),
      listImagesAction(),
    ]);

    const activities: Activity[] = [];

    // Add post activities
    posts.forEach((post) => {
      // Add post published activity
      if (post.published) {
        activities.push({
          id: `post-pub-${post.slug}`,
          type: "post_published",
          title: "Post published",
          description: post.title,
          timestamp: post.updatedAt,
          icon: "eye",
        });
      }

      // Add post created activity
      activities.push({
        id: `post-create-${post.slug}`,
        type: "post_created",
        title: "Post created",
        description: post.title,
        timestamp: post.createdAt,
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
