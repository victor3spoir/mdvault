"use server";

import type { ActionResult } from "@/features/shared/shared.types";
import octokit from "@/lib/octokit";
import type { GitHubUser } from "./settings.types";

export async function getGitHubUserAction(): Promise<ActionResult<GitHubUser>> {
  try {
    const response = await octokit.rest.users.getAuthenticated();

    const user: GitHubUser = {
      login: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url,
      bio: response.data.bio,
      profile_url: response.data.html_url,
      public_repos: response.data.public_repos,
      company: response.data.company,
      location: response.data.location,
    };

    return { success: true, data: user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch GitHub user";
    console.error("Failed to fetch GitHub user:", error);
    return { success: false, error: message };
  }
}
