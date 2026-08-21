export interface ArticleFrontmatter {
	title: string;
	description?: string;
	published: boolean;
	lang: string;
	author?: string;
	tags?: string[];
	coverImage?: string;
	createdAt?: string;
	updatedAt?: string;
	publishedDate?: string;
	translationKey?: string;
}

export interface Article {
	id: string;
	title: string;
	description?: string;
	content: string;
	lang: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
	author?: string;
	tags?: string[];
	coverImage?: string;
	translationKey?: string;
	path: string;
	sha: string;
}
