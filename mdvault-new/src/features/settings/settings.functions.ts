import { createServerFn } from "@tanstack/react-start";
import {
	getGitHubUser,
	getSettingsPageData,
} from "#/features/settings/settings.server";

export const getGitHubUserFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const result = await getGitHubUser();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	},
);

export const getSettingsPageDataFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const result = await getSettingsPageData();

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	},
);
