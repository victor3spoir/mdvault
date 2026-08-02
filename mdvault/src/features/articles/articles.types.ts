export interface ArticleFrontmatter {
	title: string;
	description?: string;
	published: boolean;
	lang: "fr" | "en";
	author?: string;
	tags?: string[];
	coverImage?: string;
	createdAt?: string;
	updatedAt?: string;
	publishedDate?: string;
}

export interface Article {
	id: string;
	title: string;
	description?: string;
	content: string;
	lang: "fr" | "en";
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
	author?: string;
	tags?: string[];
	coverImage?: string;
	path: string;
	sha: string;
}

export interface GitHubFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	type: "file" | "dir";
	download_url: string | null;
}
