export interface Activity {
  id: string;
  type: "article_created" | "article_published" | "image_uploaded";
  title: string;
  description: string;
  timestamp: string;
  icon: "file" | "image" | "eye";
}
export interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  mediaFiles: number;
}
