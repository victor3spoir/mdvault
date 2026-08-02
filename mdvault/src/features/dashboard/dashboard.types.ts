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

/**
 * Metrics for one content section. Articles, posts and every user defined vault
 * type produce the same shape, so the dashboard renders them identically.
 */
export type ContentSectionStats = {
	/** "articles", "posts", or the vault type id. */
	id: string;
	label: string;
	/** Icon key: a vault `AssetIcon` for custom types, or a built-in key. */
	icon: string;
	total: number;
	published: number;
	drafts: number;
	/** Most recent update across the section, if it has any content. */
	lastUpdatedAt?: string;
	browseTo: string;
	createTo: string;
	/** Search params to append when linking, used by vault types. */
	search?: { type: string };
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
	sections: ContentSectionStats[];
	activities: Activity[];
};
