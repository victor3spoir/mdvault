import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { ContentSectionCard } from "#/features/dashboard/components/content-section-card";
import { RecentActivity } from "#/features/dashboard/components/recent-activity";
import { dashboardOverviewQueryOptions } from "#/features/dashboard/dashboard.queries";

export const Route = createFileRoute("/cms/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(dashboardOverviewQueryOptions()),
	component: DashboardPage,
});

function DashboardPage() {
	const { sections, activities } = Route.useLoaderData();
	const totalDocuments = sections.reduce(
		(count, section) => count + section.total,
		0,
	);

	return (
		<PageLayout
			title="Dashboard"
			description="Live content data is loaded from the configured GitHub repository."
		>
			<section className="space-y-4">
				<div className="flex items-baseline justify-between gap-4">
					<h2 className="text-lg font-semibold text-balance">Contents</h2>
					<p className="text-sm text-muted-foreground">
						<span className="tabular-nums">{totalDocuments}</span> documents
						across <span className="tabular-nums">{sections.length}</span>{" "}
						sections
					</p>
				</div>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
					{sections.map((section) => (
						<ContentSectionCard key={section.id} section={section} />
					))}
				</div>
			</section>

			<RecentActivity activities={activities} />
		</PageLayout>
	);
}
