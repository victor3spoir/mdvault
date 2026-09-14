import { IconSearch } from "@tabler/icons-react";
import { rankItem } from "@tanstack/match-sorter-utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { docsSearchQueryOptions } from "#/features/docs/docs.queries";
import type { DocsSearchRecord } from "#/features/docs/docs.types";
import { cn } from "#/lib/utils";

const MAX_RESULTS = 24;

/**
 * Search dialog.
 *
 * The index is a few hundred heading-level records, so matching runs in the
 * browser with `@tanstack/match-sorter-utils` — already a dependency here.
 * At this size a round trip per keystroke costs more than the match itself.
 * Past a few thousand records the calculus flips and matching should move to
 * the server.
 */
export function DocsSearchDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);

	/** Fetched on first open, then cached: it is the largest docs payload. */
	const { data: index } = useQuery({
		...docsSearchQueryOptions(),
		enabled: open,
	});

	const results = useMemo(() => {
		if (!index || query.trim().length < 2) return [];

		return index
			.map((record) => ({
				record,
				rank: rankItem(
					`${record.title} ${record.heading} ${record.content}`,
					query,
				),
			}))
			.filter((entry) => entry.rank.passed)
			.sort((a, b) => b.rank.rank - a.rank.rank)
			.slice(0, MAX_RESULTS)
			.map((entry) => entry.record);
	}, [index, query]);

	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);

	const go = (record: DocsSearchRecord) => {
		onOpenChange(false);
		navigate({
			to: "/docs/$",
			params: { _splat: record.slug },
			hash: record.headingId || undefined,
		});
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActive((current) => Math.min(current + 1, results.length - 1));
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActive((current) => Math.max(current - 1, 0));
		}
		if (event.key === "Enter") {
			const record = results[active];
			if (record) {
				event.preventDefault();
				go(record);
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputRef.current?.focus();
				}}
				className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
			>
				<DialogTitle className="sr-only">Search the documentation</DialogTitle>
				<DialogDescription className="sr-only">
					Type at least two characters. Arrow keys move, Enter opens, Escape
					closes.
				</DialogDescription>

				<div className="flex items-center gap-3 border-b px-4">
					<IconSearch className="size-4 shrink-0 text-muted-foreground" />
					<input
						ref={inputRef}
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							/* A new query means a new result list; keeping the old cursor
							   would arm Enter with whatever happened to sit at that index. */
							setActive(0);
						}}
						onKeyDown={onKeyDown}
						placeholder="Search docs…"
						className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					/>
				</div>

				<div className="max-h-[52vh] overflow-y-auto p-2">
					{results.length ? (
						<ul className="flex flex-col gap-0.5">
							{results.map((record, position) => (
								<li key={record.id}>
									<button
										type="button"
										onMouseEnter={() => setActive(position)}
										onClick={() => go(record)}
										className={cn(
											"flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
											position === active ? "bg-accent" : "hover:bg-accent/50",
										)}
									>
										<span className="text-sm font-medium">
											{record.heading || record.title}
										</span>
										<span className="line-clamp-1 text-xs text-muted-foreground">
											{record.heading ? `${record.title} · ` : ""}
											{record.content.slice(0, 120)}
										</span>
									</button>
								</li>
							))}
						</ul>
					) : (
						<EmptyState query={query} />
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Names what is searchable instead of saying "no results" — a reader who gets
 * nothing back needs to know whether they mistyped or looked in the wrong
 * place.
 */
function EmptyState({ query }: { query: string }) {
	return (
		<p className="px-3 py-8 text-center text-sm text-muted-foreground">
			{query.trim().length < 2
				? "Search every page: setup, features, guides and architecture."
				: `Nothing matches “${query}”. Try a feature name, a route, or an environment variable.`}
		</p>
	);
}
