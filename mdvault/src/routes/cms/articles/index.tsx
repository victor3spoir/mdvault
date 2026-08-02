import { IconPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useMemo } from "react";
import { ContentFilterBar } from "#/components/content-filter-bar";
import { ContentListEmptyState } from "#/components/content-list-empty-state";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
	articlesListQueryOptions,
	prefetchArticlesMedia,
} from "#/features/articles/articles.queries";
import { ArticleCard } from "#/features/articles/components/article-card";
import {
	type ContentFilters,
	collectContentTags,
	contentFiltersSchema,
	DEFAULT_CONTENT_FILTERS,
	filterAndSortContent,
} from "#/features/shared/content-filters";

export const Route = createFileRoute("/cms/articles/")({
	validateSearch: zodValidator(contentFiltersSchema),
	loader: async ({ context }) => {
		const articles = await context.queryClient.ensureQueryData(
			articlesListQueryOptions(),
		);
		return articles;
	},
	pendingComponent: ArticlesPending,
	component: ArticlesPage,
});

function ArticlesPage() {
	const articles = Route.useLoaderData();
	const queryClient = useQueryClient();
	const filters = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const allTags = collectContentTags(articles);

	useEffect(() => {
		void prefetchArticlesMedia(queryClient, articles);
	}, [articles, queryClient]);

	const filteredArticles = useMemo(
		() => filterAndSortContent(articles, filters),
		[articles, filters],
	);

	const updateFilters = (patch: Partial<ContentFilters>) => {
		navigate({ search: (prev) => ({ ...prev, ...patch }) });
	};

	const clearFilters = () => {
		navigate({ search: () => DEFAULT_CONTENT_FILTERS });
	};

	return (
		<PageLayout
			title="Articles"
			description="Manage your content, drafts, and published articles."
			actions={
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
					>
						{filteredArticles.length} Articles
					</Badge>
					<Button
						asChild
						size="sm"
						className="h-8 rounded-lg px-3 shadow-sm hover:shadow-md"
					>
						<Link to="/cms/articles/new" className="gap-2">
							<IconPlus className="size-4" />
							Create Article
						</Link>
					</Button>
				</div>
			}
		>
			{articles.length > 0 ? (
				<ContentFilterBar
					filters={filters}
					onChange={updateFilters}
					label="articles"
					availableTags={allTags}
				/>
			) : null}

			{articles.length === 0 ? (
				<ContentListEmptyState
					title="No articles yet"
					description="Create your first article to start building your content library."
					action={
						<Button asChild size="sm">
							<Link to="/cms/articles/new">
								<IconPlus data-icon="inline-start" />
								Create article
							</Link>
						</Button>
					}
				/>
			) : filteredArticles.length === 0 ? (
				<ContentListEmptyState
					title="No articles match these filters"
					description="Try another search, status, language, or tag to find the article you need."
					action={
						<Button variant="outline" size="sm" onClick={clearFilters}>
							Clear filters
						</Button>
					}
				/>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
					{filteredArticles.map((article) => (
						<ArticleCard key={article.id} article={article} />
					))}
				</div>
			)}
		</PageLayout>
	);
}

function ArticlesPending() {
	return (
		<PageLayout title="Articles" description="Loading your articles...">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
				{[
					"article-skeleton-1",
					"article-skeleton-2",
					"article-skeleton-3",
					"article-skeleton-4",
					"article-skeleton-5",
					"article-skeleton-6",
				].map((id) => (
					<div key={id} className="overflow-hidden rounded-2xl border">
						<Skeleton className="aspect-video rounded-none" />
						<div className="space-y-3 p-5">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
				))}
			</div>
		</PageLayout>
	);
}
