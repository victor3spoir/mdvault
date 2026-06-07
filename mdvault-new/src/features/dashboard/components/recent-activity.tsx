import {
	IconEdit,
	IconEye,
	IconFileText,
	IconPhoto,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { Activity } from "#/features/dashboard/dashboard.types";
import { cn } from "#/lib/utils";

const iconMap = {
	file: IconFileText,
	image: IconPhoto,
	eye: IconEye,
	edit: IconEdit,
};

const colorMap = {
	article_created: "text-blue-500 bg-blue-500/10",
	article_published: "text-green-500 bg-green-500/10",
	article_updated: "text-amber-500 bg-amber-500/10",
	image_uploaded: "text-purple-500 bg-purple-500/10",
};

export function RecentActivity({ activities }: { activities: Activity[] }) {
	if (activities.length === 0) {
		return (
			<div className="rounded-xl border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">No recent activity yet.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Recent Activity</h2>
			<div className="rounded-xl border bg-card">
				<div className="divide-y">
					{activities.map((activity) => {
						const Icon = iconMap[activity.icon];
						const colorClass = colorMap[activity.type];

						return (
							<div
								key={activity.id}
								className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
							>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full",
										colorClass,
									)}
								>
									<Icon className="size-5" />
								</div>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium sm:text-base">
										{activity.title}:{" "}
										<span className="font-normal text-muted-foreground">
											{activity.description}
										</span>
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{new Date(activity.timestamp).toLocaleString()}
									</p>
								</div>

								{activity.link ? (
									<Link
										to={activity.link}
										className="text-xs font-medium text-primary hover:underline"
									>
										View
									</Link>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
