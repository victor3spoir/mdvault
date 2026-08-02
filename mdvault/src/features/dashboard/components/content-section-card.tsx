import {
	IconArrowRight,
	IconArticle,
	IconMessage2,
	IconPlus,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { ContentSectionStats } from "#/features/dashboard/dashboard.types";
import { getAssetIcon } from "#/features/vault/vault-icons";
import { formatDate } from "#/lib/date";
import { cn } from "#/lib/utils";

const BUILT_IN_ICONS = {
	article: IconArticle,
	post: IconMessage2,
} as const;

function sectionIcon(icon: string) {
	return (
		BUILT_IN_ICONS[icon as keyof typeof BUILT_IN_ICONS] ?? getAssetIcon(icon)
	);
}

function Metric({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone: "total" | "published" | "draft";
}) {
	return (
		<div className="rounded-lg bg-muted/40 px-3 py-2.5">
			<p
				className={cn(
					"text-2xl font-semibold leading-none tabular-nums",
					tone === "published" && "text-emerald-600 dark:text-emerald-400",
					tone === "draft" && "text-amber-600 dark:text-amber-400",
				)}
			>
				{value}
			</p>
			<p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
		</div>
	);
}

export function ContentSectionCard({
	section,
}: {
	section: ContentSectionStats;
}) {
	const Icon = sectionIcon(section.icon);
	const publishedShare =
		section.total > 0 ? (section.published / section.total) * 100 : 0;

	return (
		<section className="flex flex-col rounded-2xl border bg-card p-5">
			<header className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<div className="rounded-lg bg-primary/10 p-2 text-primary">
						<Icon className="size-4" aria-hidden="true" />
					</div>
					<div>
						<h2 className="text-sm font-semibold leading-tight text-balance">
							{section.label}
						</h2>
						<p className="text-xs text-muted-foreground">
							{section.lastUpdatedAt
								? `Updated ${formatDate(section.lastUpdatedAt)}`
								: "No content yet"}
						</p>
					</div>
				</div>

				<Link
					to={section.createTo}
					search={section.search}
					aria-label={`Create ${section.label}`}
					title={`Create ${section.label}`}
					className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-[color,background-color,scale] hover:bg-muted hover:text-foreground active:scale-[0.96]"
				>
					<IconPlus className="size-4" aria-hidden="true" />
				</Link>
			</header>

			<div className="mt-4 grid grid-cols-3 gap-2">
				<Metric label="Total" value={section.total} tone="total" />
				<Metric label="Published" value={section.published} tone="published" />
				<Metric label="Drafts" value={section.drafts} tone="draft" />
			</div>

			<div
				className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
				role="img"
				aria-label={`${section.published} of ${section.total} published`}
			>
				<div
					className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
					style={{ width: `${publishedShare}%` }}
				/>
			</div>

			<Link
				to={section.browseTo}
				search={section.search}
				className="group mt-4 flex items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
			>
				Manage {section.label}
				<IconArrowRight
					className="size-4 transition-transform group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</Link>
		</section>
	);
}
