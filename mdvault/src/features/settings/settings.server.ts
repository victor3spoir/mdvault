import type {
	GitHubUser,
	SettingsPageData,
} from "#/features/settings/settings.types";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

export async function getGitHubUser(): Promise<ActionResult<GitHubUser>> {
	try {
		const octokit = getGitHubClient();
		const response = await octokit.rest.users.getAuthenticated();

		return {
			success: true,
			data: {
				login: response.data.login,
				name: response.data.name,
				avatar_url: response.data.avatar_url,
				bio: response.data.bio,
				profile_url: response.data.html_url,
				public_repos: response.data.public_repos,
				company: response.data.company,
				location: response.data.location,
			},
		};
	} catch (error) {
		logger.error("Failed to fetch GitHub user", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function getSettingsPageData(): Promise<
	ActionResult<SettingsPageData>
> {
	try {
		const octokit = getGitHubClient();
		const githubEnv = getGitHubEnv();

		const [userResponse, repoResponse] = await Promise.all([
			octokit.rest.users.getAuthenticated(),
			octokit.rest.repos.get({
				owner: githubEnv.GITHUB_OWNER,
				repo: githubEnv.GITHUB_REPO,
			}),
		]);

		return {
			success: true,
			data: {
				user: {
					login: userResponse.data.login,
					name: userResponse.data.name,
					avatar_url: userResponse.data.avatar_url,
					bio: userResponse.data.bio,
					profile_url: userResponse.data.html_url,
					public_repos: userResponse.data.public_repos,
					company: userResponse.data.company,
					location: userResponse.data.location,
				},
				repository: {
					owner: githubEnv.GITHUB_OWNER,
					repo: githubEnv.GITHUB_REPO,
					branch: repoResponse.data.default_branch || "main",
				},
				site: {
					name: process.env.VITE_APP_TITLE || "MDVault",
					url: process.env.SERVER_URL || "https://example.com",
				},
			},
		};
	} catch (error) {
		logger.error("Failed to fetch settings page data", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}
