import {
	IconFilter,
	IconPlus,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect } from "react";
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
import { PostCard } from "#/features/posts/components/post-card";
import {
	postsListQueryOptions,
	prefetchPostsMedia,
} from "#/features/posts/posts.queries";
import { filterAndSortPosts } from "#/features/posts/posts.utils";

const postsSearchSchema = z.object({
	searchQuery: z.string().default(""),
	status: z.enum(["all", "published", "draft"]).default("all"),
	lang: z.enum(["all", "fr", "en"]).default("all"),
	sortBy: z.enum(["date", "title"]).default("date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const Route = createFileRoute("/cms/posts/")({
	validateSearch: zodValidator(postsSearchSchema),
	loader: async ({ context }) => {
		const posts = await context.queryClient.ensureQueryData(
			postsListQueryOptions(),
		);
		return posts;
	},
	pendingComponent: PostsPending,
	component: PostsPage,
});

function PostsPage() {
	const posts = Route.useLoaderData();
	const queryClient = useQueryClient();
	const { lang, searchQuery, sortBy, sortOrder, status } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const filteredPosts = filterAndSortPosts(posts, {
		lang,
		searchQuery,
		sortBy,
		sortOrder,
		status,
	});

	useEffect(() => {
		void prefetchPostsMedia(queryClient, posts);
	}, [posts, queryClient]);

	const clearFilters = () => {
		navigate({
			search: (prev) => ({
				...prev,
				searchQuery: "",
				status: "all",
				lang: "all",
			}),
		});
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
					<Button asChild className="gap-2 rounded-xl">
						<Link to="/cms/posts/new">
							<IconPlus className="size-4" />
							New Post
						</Link>
					</Button>
				</div>
			}
		>
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
			) : (
				<>
					<div className="flex flex-col gap-4 rounded-3xl border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<IconSearch className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(event) =>
									navigate({
										search: (prev) => ({
											...prev,
											searchQuery: event.target.value,
										}),
									})
								}
								placeholder="Search posts by title, content or author..."
								aria-label="Search posts"
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
									aria-label="Filter posts by status"
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
									aria-label="Filter posts by language"
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
										aria-label={`Sort posts ${sortOrder === "asc" ? "ascending" : "descending"}`}
										className="size-11 rounded-2xl bg-muted/50 hover:bg-muted"
									>
										{sortOrder === "asc" ? (
											<IconSortAscending />
										) : (
											<IconSortDescending />
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

					{filteredPosts.length === 0 ? (
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
				</>
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
