export interface GitHubEnv {
	GITHUB_TOKEN: string;
	GITHUB_OWNER: string;
	GITHUB_REPO: string;
	ARTICLES_PATH: string;
	POSTS_PATH: string;
	MEDIA_PATH: string;
}

export function getGitHubEnv(): GitHubEnv {
	const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
	const GITHUB_OWNER = process.env.GITHUB_OWNER;
	const GITHUB_REPO = process.env.GITHUB_REPO;

	const missing = [
		["GITHUB_TOKEN", GITHUB_TOKEN],
		["GITHUB_OWNER", GITHUB_OWNER],
		["GITHUB_REPO", GITHUB_REPO],
	]
		.filter(([, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}

	return {
		GITHUB_TOKEN: GITHUB_TOKEN as string,
		GITHUB_OWNER: GITHUB_OWNER as string,
		GITHUB_REPO: GITHUB_REPO as string,
		ARTICLES_PATH: process.env.ARTICLES_PATH ?? "articles",
		POSTS_PATH: process.env.POSTS_PATH ?? "posts",
		MEDIA_PATH: process.env.MEDIA_PATH ?? "media",
	};
}
