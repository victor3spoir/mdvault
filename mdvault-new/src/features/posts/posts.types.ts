export interface PostFrontmatter {
	title: string;
	content: string;
	published: boolean;
	lang: "fr" | "en";
	author?: string;
	article?: string;
	coverImage?: string;
	createdAt?: string;
	updatedAt?: string;
	publishedDate?: string;
}

export interface Post {
	id: string;
	title: string;
	content: string;
	lang: "fr" | "en";
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
	author?: string;
	article?: string;
	coverImage?: string;
	sha?: string;
}

export interface GitHubFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	type: "file" | "dir";
	download_url: string | null;
}
