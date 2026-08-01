import {
	IconArrowRight,
	IconArticle,
	IconEye,
	IconFileText,
	IconMessage2,
	IconPhoto,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { RecentActivity } from "#/features/dashboard/components/recent-activity";
import { dashboardOverviewQueryOptions } from "#/features/dashboard/dashboard.queries";
import { cn } from "#/lib/utils";

const quickLinks = [
	{ label: "Browse Articles", to: "/cms/articles" },
	{ label: "Create Post", to: "/cms/posts/new" },
	{ label: "Open Media", to: "/cms/media" },
] as const;

export const Route = createFileRoute("/cms/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(dashboardOverviewQueryOptions()),
	component: DashboardPage,
});

function DashboardPage() {
	const { stats, activities } = Route.useLoaderData();
	const statCards = [
		{
			label: "Articles",
			value: stats.totalArticles,
			detail: undefined,
			icon: IconArticle,
			iconClassName: "bg-blue-500/10 text-blue-500",
		},
		{
			label: "Published",
			value: stats.publishedArticles,
			detail: undefined,
			icon: IconEye,
			iconClassName: "bg-green-500/10 text-green-500",
		},
		{
			label: "Drafts",
			value: stats.draftArticles,
			detail: undefined,
			icon: IconFileText,
			iconClassName: "bg-amber-500/10 text-amber-500",
		},
		{
			label: "Posts",
			value: stats.totalPosts,
			detail: `${stats.publishedPosts} published · ${stats.draftPosts} drafts`,
			icon: IconMessage2,
			iconClassName: "bg-cyan-500/10 text-cyan-500",
		},
		{
			label: "Media Files",
			value: stats.mediaFiles,
			detail: undefined,
			icon: IconPhoto,
			iconClassName: "bg-purple-500/10 text-purple-500",
		},
	] as const;

	return (
		<PageLayout
			title="Dashboard"
			description="Live content data is now loaded from the configured GitHub repository."
		>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
				{statCards.map((stat) => (
					<div key={stat.label} className="rounded-2xl border bg-card p-5">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-sm text-muted-foreground">{stat.label}</p>
								<p className="mt-2 text-3xl font-bold">{stat.value}</p>
								{stat.detail ? (
									<p className="mt-1 text-xs text-muted-foreground">
										{stat.detail}
									</p>
								) : null}
							</div>
							<div className={cn("rounded-lg p-2", stat.iconClassName)}>
								<stat.icon className="size-4" aria-hidden="true" />
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="rounded-2xl border bg-card p-6">
				<h2 className="text-lg font-semibold">Quick Links</h2>
				<div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
					{quickLinks.map((link) => (
						<Link
							key={link.to}
							to={link.to}
							className="group flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
						>
							{link.label}
							<IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
						</Link>
					))}
				</div>
			</div>

			<RecentActivity activities={activities} />
		</PageLayout>
	);
}
