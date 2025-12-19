"use server";

import { listImagesAction } from "@/features/posts/actions/images.actions";
import { listPostsAction } from "@/features/posts/actions/posts.actions";

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  mediaFiles: number;
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
