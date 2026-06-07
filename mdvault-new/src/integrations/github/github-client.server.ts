import { Octokit } from "@octokit/rest";
import { getGitHubEnv } from "#/integrations/github/github-env.server";

export function getGitHubClient() {
	const env = getGitHubEnv();

	return new Octokit({
		auth: env.GITHUB_TOKEN,
	});
}
