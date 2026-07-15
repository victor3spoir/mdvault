export type Activity = {
	id: string;
	type:
		| "article_created"
		| "article_published"
		| "article_updated"
		| "post_created"
		| "post_published"
		| "post_updated"
		| "image_uploaded";
	title: string;
	description: string;
	timestamp: string;
	icon: "file" | "image" | "eye" | "edit";
	link?: string;
};

export type DashboardContentItem = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
};

export type DashboardStats = {
	totalArticles: number;
	publishedArticles: number;
	draftArticles: number;
	totalPosts: number;
	publishedPosts: number;
	draftPosts: number;
	mediaFiles: number;
};

export type DashboardOverview = {
	stats: DashboardStats;
	activities: Activity[];
};
