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
 * Refreshes the interface after a mutation.
 *
 * Every write needs two things to happen, and forgetting either one leaves the
 * user staring at stale data:
 *
 * 1. The query cache must refetch. `refetchType: "all"` is required because the
 *    lists render from route loader data rather than a `useQuery` hook, so the
 *    queries have no active observer and the default would only mark them
 *    stale.
 * 2. The router must re-run its loaders, otherwise pages reading
 *    `Route.useLoaderData()` keep rendering the value they were given.
 *
 * Doing both by hand at every call site is how a publish button ends up
 * updating the badge only after a page reload, so this hook owns the pair.
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
			// Counts and recent activity move with every content change.
			queryClient.invalidateQueries({
				queryKey: dashboardKeys.all,
				refetchType: "all",
			}),
		]);

		await router.invalidate();
	}, [queryClient, router, scope]);
}
