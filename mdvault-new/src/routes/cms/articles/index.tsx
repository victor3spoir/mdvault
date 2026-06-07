import {
	IconFilter,
	IconPlus,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
	IconX,
} from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { getArticles } from "#/features/articles/articles.functions";
import { ArticleCard } from "#/features/articles/components/article-card";

export const Route = createFileRoute("/cms/articles/")({
	validateSearch: (search: Record<string, unknown>) => ({
		searchQuery:
			typeof search.searchQuery === "string" ? search.searchQuery : "",
		status:
			search.status === "published" || search.status === "draft"
				? search.status
				: "all",
		lang: search.lang === "fr" || search.lang === "en" ? search.lang : "all",
		sortBy: search.sortBy === "title" ? "title" : "date",
		sortOrder: search.sortOrder === "asc" ? "asc" : "desc",
		tags: Array.isArray(search.tags)
			? search.tags.filter(
					(value): value is string => typeof value === "string",
				)
			: [],
	}),
	loader: () => getArticles(),
	component: ArticlesPage,
});

function ArticlesPage() {
	const articles = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [localQuery, setLocalQuery] = useState(search.searchQuery);
	const allTags = Array.from(
		new Set(articles.flatMap((article) => article.tags ?? []).sort()),
	);

	const filteredArticles = useMemo(() => {
		return articles
			.filter((article) => {
				const query = localQuery.trim().toLowerCase();
				const matchesSearch =
					!query ||
					article.title.toLowerCase().includes(query) ||
					article.description?.toLowerCase().includes(query) ||
					article.tags?.some((tag) => tag.toLowerCase().includes(query));
				const matchesStatus =
					search.status === "all" ||
					(search.status === "published"
						? article.published
						: !article.published);
				const matchesLang =
					search.lang === "all" || article.lang === search.lang;
				const matchesTags =
					search.tags.length === 0 ||
					search.tags.some((tag) => article.tags?.includes(tag));

				return matchesSearch && matchesStatus && matchesLang && matchesTags;
			})
			.sort((a, b) => {
				const modifier = search.sortOrder === "asc" ? 1 : -1;
				if (search.sortBy === "title") {
					return a.title.localeCompare(b.title) * modifier;
				}
				return (
					(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
					modifier
				);
			});
	}, [articles, localQuery, search]);

	const toggleTag = (tag: string) => {
		const nextTags = search.tags.includes(tag)
			? search.tags.filter((value) => value !== tag)
			: [...search.tags, tag];
		navigate({ search: (prev) => ({ ...prev, tags: nextTags }) });
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
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 rounded-3xl border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<IconSearch className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={localQuery}
							onChange={(event) => {
								const value = event.target.value;
								setLocalQuery(value);
								navigate({
									search: (prev) => ({ ...prev, searchQuery: value }),
								});
							}}
							placeholder="Search articles by title, tags or description..."
							className="h-11 rounded-2xl border-none bg-muted/50 pr-4 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<Select
							value={search.status}
							onValueChange={(value) =>
								navigate({
									search: (prev) => ({
										...prev,
										status: value as "all" | "published" | "draft",
									}),
								})
							}
						>
							<SelectTrigger className="h-11 w-35 rounded-2xl border-none bg-muted/50 focus:ring-1 focus:ring-primary/20">
								<div className="flex items-center gap-2">
									<IconFilter className="size-4 text-muted-foreground" />
									<SelectValue placeholder="Status" />
								</div>
							</SelectTrigger>
							<SelectContent className="rounded-2xl border-muted">
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="draft">Drafts</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={search.lang}
							onValueChange={(value) =>
								navigate({
									search: (prev) => ({
										...prev,
										lang: value as "all" | "fr" | "en",
									}),
								})
							}
						>
							<SelectTrigger className="h-11 w-40 rounded-2xl border-none bg-muted/50 focus:ring-1 focus:ring-primary/20">
								<SelectValue placeholder="Language" />
							</SelectTrigger>
							<SelectContent className="rounded-2xl border-muted">
								<SelectItem value="all">All Languages</SelectItem>
								<SelectItem value="en">English</SelectItem>
								<SelectItem value="fr">Français</SelectItem>
							</SelectContent>
						</Select>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
								>
									{search.sortOrder === "asc" ? (
										<IconSortAscending className="size-5" />
									) : (
										<IconSortDescending className="size-5" />
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48 rounded-2xl">
								<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
									Sort by
								</div>
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
								<DropdownMenuSeparator />
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
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{allTags.length > 0 ? (
					<div className="flex flex-wrap gap-2 px-2">
						{allTags.map((tag) => (
							<Badge
								key={tag}
								variant={search.tags.includes(tag) ? "default" : "outline"}
								className="cursor-pointer rounded-lg px-3 py-1 transition-all hover:bg-primary/10 hover:text-primary"
								onClick={() => toggleTag(tag)}
							>
								{tag}
								{search.tags.includes(tag) ? (
									<IconX className="ml-1.5 size-3" />
								) : null}
							</Badge>
						))}
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
				{filteredArticles.map((article) => (
					<ArticleCard key={article.id} article={article} />
				))}
			</div>
		</PageLayout>
	);
}
