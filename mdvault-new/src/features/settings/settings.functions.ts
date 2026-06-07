import { createServerFn } from "@tanstack/react-start";
import { getGitHubUser } from "#/features/settings/settings.server";

export const getGitHubUserFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const result = await getGitHubUser();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	},
);
