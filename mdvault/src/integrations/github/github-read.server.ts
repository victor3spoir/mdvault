import { getGitHubClient } from "#/integrations/github/github-client.server";

type GitHubClient = ReturnType<typeof getGitHubClient>;

export function runGitHubRead<T>(
	operation: (client: GitHubClient) => Promise<T>,
): Promise<T> {
	return operation(getGitHubClient());
}
