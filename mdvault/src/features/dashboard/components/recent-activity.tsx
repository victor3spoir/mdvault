import { Link } from "@tanstack/react-router";
import type { Activity } from "#/features/dashboard/dashboard.types";
import { cn } from "#/lib/utils";

/**
 * Each event type gets a dot colour so the log can be scanned by shape before
 * it is read, and a lowercase label so rows read like log lines.
 */
const eventStyles: Record<Activity["type"], { label: string; dot: string }> = {
	article_created: { label: "article created", dot: "bg-blue-500" },
	article_updated: { label: "article updated", dot: "bg-amber-500" },
	article_published: { label: "article published", dot: "bg-green-500" },
	post_created: { label: "post created", dot: "bg-cyan-500" },
	post_updated: { label: "post updated", dot: "bg-orange-500" },
	post_published: { label: "post published", dot: "bg-emerald-500" },
	image_uploaded: { label: "image uploaded", dot: "bg-purple-500" },
};

/** Compact log timestamp: the year is noise for a recent-activity feed. */
const logTimeFormatter = new Intl.DateTimeFormat("en-GB", {
	month: "short",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function formatLogTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "--"
		: logTimeFormatter.format(date).replace(",", "");
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold text-balance">Recent Activity</h2>

			{activities.length === 0 ? (
				<div className="rounded-2xl border border-dashed p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No recent activity yet.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border bg-card">
					<table className="w-full table-fixed border-collapse">
						<tbody className="divide-y">
							{activities.map((activity) => {
								const event = eventStyles[activity.type];

								return (
									<tr
										key={activity.id}
										className="transition-colors hover:bg-muted/40"
									>
										<td className="w-[7.5rem] whitespace-nowrap py-2 pl-4 pr-3 font-mono text-xs tabular-nums text-muted-foreground">
											{formatLogTime(activity.timestamp)}
										</td>

										<td className="hidden w-[11rem] whitespace-nowrap px-3 py-2 sm:table-cell">
											<span className="flex items-center gap-2 text-xs text-muted-foreground">
												<span
													className={cn(
														"size-1.5 shrink-0 rounded-full",
														event.dot,
													)}
													aria-hidden="true"
												/>
												{event.label}
											</span>
										</td>

										<td className="py-2 pl-3 pr-4 text-sm">
											{activity.link ? (
												<Link
													to={activity.link}
													className="block truncate hover:text-primary hover:underline underline-offset-4"
												>
													{activity.description}
												</Link>
											) : (
												<span className="block truncate">
													{activity.description}
												</span>
											)}
											<span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
												{event.label}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
