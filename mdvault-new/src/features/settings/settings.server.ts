import type { GitHubUser } from "#/features/settings/settings.types";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
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
