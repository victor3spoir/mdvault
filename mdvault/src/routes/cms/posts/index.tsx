import { IconPlus } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { ContentFilterBar } from "#/components/content-filter-bar";
import { ContentListEmptyState } from "#/components/content-list-empty-state";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { PostCard } from "#/features/posts/components/post-card";
import { postsListQueryOptions } from "#/features/posts/posts.queries";
import {
	type ContentFilters,
	collectContentTags,
	contentFiltersSchema,
	DEFAULT_CONTENT_FILTERS,
	filterAndSortContent,
} from "#/features/shared/content-filters";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

export const Route = createFileRoute("/cms/posts/")({
	validateSearch: zodValidator(contentFiltersSchema),
	loader: async ({ context }) => {
		const [posts, config] = await Promise.all([
			context.queryClient.ensureQueryData(postsListQueryOptions()),
			context.queryClient.ensureQueryData(vaultConfigQueryOptions()),
		]);
		return { posts, config };
	},
	pendingComponent: PostsPending,
	component: PostsPage,
});

function PostsPage() {
	const { posts, config } = Route.useLoaderData();
	const filters = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const allTags = collectContentTags(posts);

	const filteredPosts = useMemo(
		() => filterAndSortContent(posts, filters),
		[posts, filters],
	);

	const updateFilters = (patch: Partial<ContentFilters>) => {
		navigate({ search: (prev) => ({ ...prev, ...patch }) });
	};

	const clearFilters = () => {
		navigate({ search: () => DEFAULT_CONTENT_FILTERS });
	};

	return (
		<PageLayout
			title="Posts"
			description="Manage your LinkedIn-style posts."
			actions={
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
					>
						{filteredPosts.length} Posts
					</Badge>
					<Button
						asChild
						size="sm"
						className="h-8 rounded-lg px-3 shadow-sm hover:shadow-md"
					>
						<Link to="/cms/posts/new" className="gap-2">
							<IconPlus className="size-4" />
							New Post
						</Link>
					</Button>
				</div>
			}
		>
			{posts.length > 0 ? (
				<ContentFilterBar
					filters={filters}
					onChange={updateFilters}
					onClear={clearFilters}
					label="posts"
					availableTags={allTags}
					locales={config.locales}
				/>
			) : null}

			{posts.length === 0 ? (
				<ContentListEmptyState
					title="No posts yet"
					description="Create your first post to start sharing concise updates with your audience."
					action={
						<Button asChild size="sm">
							<Link to="/cms/posts/new">
								<IconPlus data-icon="inline-start" />
								Create post
							</Link>
						</Button>
					}
				/>
			) : filteredPosts.length === 0 ? (
				<ContentListEmptyState
					title="No posts match these filters"
					description="Try another search, status, or language to find the post you need."
					action={
						<Button variant="outline" size="sm" onClick={clearFilters}>
							Clear filters
						</Button>
					}
				/>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
					{filteredPosts.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
				</div>
			)}
		</PageLayout>
	);
}

function PostsPending() {
	return (
		<PageLayout title="Posts" description="Loading your posts...">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
				{[
					"post-skeleton-1",
					"post-skeleton-2",
					"post-skeleton-3",
					"post-skeleton-4",
					"post-skeleton-5",
					"post-skeleton-6",
				].map((id) => (
					<div key={id} className="overflow-hidden rounded-2xl border p-5">
						<div className="flex items-center gap-3">
							<Skeleton className="size-10 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-1/2" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
						<div className="mt-5 space-y-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</div>
				))}
			</div>
		</PageLayout>
	);
}
