import {
	IconFilter,
	IconPlus,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
	IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { ContentListEmptyState } from "#/components/content-list-empty-state";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import {
	articlesListQueryOptions,
	prefetchArticlesMedia,
} from "#/features/articles/articles.queries";
import { ArticleCard } from "#/features/articles/components/article-card";

const articlesSearchSchema = z.object({
	searchQuery: z.string().default(""),
	status: z.enum(["all", "published", "draft"]).default("all"),
	lang: z.enum(["all", "fr", "en"]).default("all"),
	sortBy: z.enum(["date", "title"]).default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	tags: z.preprocess((value) => {
		if (typeof value === "string") {
			return [value];
		}

		if (Array.isArray(value)) {
			return value.filter((item): item is string => typeof item === "string");
		}

		return [];
	}, z.array(z.string()).default([])),
});

export const Route = createFileRoute("/cms/articles/")({
	validateSearch: zodValidator(articlesSearchSchema),
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
	const { lang, searchQuery, sortBy, sortOrder, status, tags } =
		Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const allTags = Array.from(
		new Set(articles.flatMap((article) => article.tags ?? []).sort()),
	);

	useEffect(() => {
		void prefetchArticlesMedia(queryClient, articles);
	}, [articles, queryClient]);
	const filteredArticles = useMemo(() => {
		return articles
			.filter((article) => {
				const query = searchQuery.trim().toLowerCase();
				const matchesSearch =
					!query ||
					article.title.toLowerCase().includes(query) ||
					article.description?.toLowerCase().includes(query) ||
					article.tags?.some((tag) => tag.toLowerCase().includes(query));
				const matchesStatus =
					status === "all" ||
					(status === "published" ? article.published : !article.published);
				const matchesLang = lang === "all" || article.lang === lang;
				const matchesTags =
					tags.length === 0 || tags.some((tag) => article.tags?.includes(tag));

				return matchesSearch && matchesStatus && matchesLang && matchesTags;
			})
			.sort((a, b) => {
				const modifier = sortOrder === "asc" ? 1 : -1;
				if (sortBy === "title") {
					return a.title.localeCompare(b.title) * modifier;
				}
				return (
					(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
					modifier
				);
			});
	}, [articles, lang, searchQuery, sortBy, sortOrder, status, tags]);

	const toggleTag = (tag: string) => {
		const nextTags = tags.includes(tag)
			? tags.filter((value) => value !== tag)
			: [...tags, tag];
		navigate({ search: (prev) => ({ ...prev, tags: nextTags }) });
	};

	const clearFilters = () => {
		navigate({
			search: (prev) => ({
				...prev,
				searchQuery: "",
				status: "all",
				lang: "all",
				tags: [],
			}),
		});
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
						className="h-8 rounded-lg px-3 shadow-sm transition-all hover:shadow-md active:scale-95"
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
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-4 rounded-3xl border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<IconSearch className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(event) => {
									const value = event.target.value;
									navigate({
										search: (prev) => ({ ...prev, searchQuery: value }),
									});
								}}
								placeholder="Search articles by title, tags or description..."
								aria-label="Search articles"
								className="h-11 rounded-2xl border-none bg-muted/50 pr-4 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Select
								value={status}
								onValueChange={(value) =>
									navigate({
										search: (prev) => ({
											...prev,
											status: value as "all" | "published" | "draft",
										}),
									})
								}
							>
								<SelectTrigger
									aria-label="Filter articles by status"
									className="h-11 w-35 rounded-2xl border-muted bg-muted/50 px-4 font-normal hover:bg-muted/70"
								>
									<IconFilter className="size-4 text-muted-foreground" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="w-40 rounded-2xl">
									<SelectGroup>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="published">Published</SelectItem>
										<SelectItem value="draft">Drafts</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>

							<Select
								value={lang}
								onValueChange={(value) =>
									navigate({
										search: (prev) => ({
											...prev,
											lang: value as "all" | "en" | "fr",
										}),
									})
								}
							>
								<SelectTrigger
									aria-label="Filter articles by language"
									className="h-11 w-40 rounded-2xl border-muted bg-muted/50 px-4 font-normal hover:bg-muted/70"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="w-40 rounded-2xl">
									<SelectGroup>
										<SelectItem value="all">All Languages</SelectItem>
										<SelectItem value="en">English</SelectItem>
										<SelectItem value="fr">Français</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Sort articles ${sortOrder === "asc" ? "ascending" : "descending"}`}
										className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
									>
										{sortOrder === "asc" ? (
											<IconSortAscending className="size-5" />
										) : (
											<IconSortDescending className="size-5" />
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48 rounded-2xl">
									<DropdownMenuLabel>Sort by</DropdownMenuLabel>
									<DropdownMenuGroup>
										<DropdownMenuItem
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, sortBy: "date" }),
												})
											}
										>
											Date
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, sortBy: "title" }),
												})
											}
										>
											Title
										</DropdownMenuItem>
									</DropdownMenuGroup>
									<DropdownMenuSeparator />
									<DropdownMenuGroup>
										<DropdownMenuItem
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, sortOrder: "asc" }),
												})
											}
										>
											Ascending
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, sortOrder: "desc" }),
												})
											}
										>
											Descending
										</DropdownMenuItem>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{allTags.length > 0 ? (
						<div className="flex flex-wrap gap-2 px-2">
							{allTags.map((tag) => (
								<Badge
									key={tag}
									asChild
									variant={tags.includes(tag) ? "default" : "outline"}
									className="cursor-pointer rounded-lg px-3 py-1 transition-all hover:bg-primary/10 hover:text-primary"
								>
									<button
										type="button"
										aria-pressed={tags.includes(tag)}
										onClick={() => toggleTag(tag)}
									>
										{tag}
										{tags.includes(tag) ? (
											<IconX className="ml-1.5 size-3" />
										) : null}
									</button>
								</Badge>
							))}
						</div>
					) : null}
				</div>
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
