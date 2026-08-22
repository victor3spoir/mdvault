import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	articleKeys,
	invalidateArticleQueries,
} from "#/features/articles/articles.queries";
import { dashboardKeys } from "#/features/dashboard/dashboard.queries";
import {
	invalidatePostQueries,
	postKeys,
} from "#/features/posts/posts.queries";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const queryClient = { invalidateQueries } as unknown as QueryClient;

describe("content query keys", () => {
	beforeEach(() => {
		invalidateQueries.mockClear();
	});

	it("creates stable hierarchical keys", () => {
		expect(articleKeys.list()).toEqual(["articles", "list"]);
		expect(articleKeys.detail("article-id")).toEqual([
			"articles",
			"detail",
			"article-id",
		]);
		expect(postKeys.list()).toEqual(["posts", "list"]);
		expect(postKeys.detail("post-id")).toEqual(["posts", "detail", "post-id"]);
		expect(dashboardKeys.overview()).toEqual(["dashboard", "overview"]);
	});

	it("invalidates articles and dashboard together", async () => {
		await invalidateArticleQueries(queryClient);

		expect(invalidateQueries).toHaveBeenCalledTimes(2);
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: articleKeys.all,
			refetchType: "all",
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: dashboardKeys.all,
			refetchType: "all",
		});
	});

	it("invalidates posts and dashboard together", async () => {
		await invalidatePostQueries(queryClient);

		expect(invalidateQueries).toHaveBeenCalledTimes(2);
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: postKeys.all,
			refetchType: "all",
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: dashboardKeys.all,
			refetchType: "all",
		});
	});

	/**
	 * The lists render from route loader data rather than a useQuery hook, so
	 * the queries have no active observer. Without refetchType "all" they are
	 * marked stale but never refetched, and ensureQueryData in the loader hands
	 * back the stale cache - a published post keeps showing "Draft" until the
	 * page is reloaded.
	 */
	it("forces a refetch even without an active observer", async () => {
		await invalidatePostQueries(queryClient);

		for (const call of invalidateQueries.mock.calls) {
			expect(call[0]).toMatchObject({ refetchType: "all" });
		}
	});
});
