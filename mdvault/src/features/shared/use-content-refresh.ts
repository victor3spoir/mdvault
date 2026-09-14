import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { articleKeys } from "#/features/articles/articles.queries";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";
import { postKeys } from "#/features/posts/posts.queries";
import { vaultKeys } from "#/features/vault/vault.queries";

const SCOPES = {
	articles: articleKeys.all,
	posts: postKeys.all,
	vault: vaultKeys.all,
} as const;

export type ContentScope = keyof typeof SCOPES;

/**
 * Refresh inactive lists before navigation as well as visible query subscribers.
 * Reload route snapshots synchronously for detail and editor screens.
 */
export function useContentRefresh(scope: ContentScope) {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: SCOPES[scope],
				refetchType: "all",
			}),
			queryClient.invalidateQueries({
				queryKey: dashboardKeys.all,
				refetchType: "all",
			}),
			queryClient.invalidateQueries({ queryKey: ["media", "audit"] }),
		]);

		await router.invalidate({ sync: true });
	}, [queryClient, router, scope]);
}
