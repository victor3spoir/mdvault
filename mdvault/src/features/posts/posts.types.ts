export interface Post {
	id: string;
	title: string;
	content: string;
	lang: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	published: boolean;
	author?: string;
	article?: string;
	coverImage?: string;
	path: string;
	sha: string;
}
