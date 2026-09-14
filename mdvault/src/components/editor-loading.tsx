import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";

interface EditorLoadingProps {
	withToolbar?: boolean;
}

const TOOL_GROUPS = [
	["undo", "redo"],
	["bold", "italic", "strike", "code"],
	["h2", "h3", "h4"],
	["bullets", "numbers", "tasks", "quote", "callout", "code-block"],
	["find", "outline", "link", "image", "table", "rule"],
];

export function EditorLoading({ withToolbar = false }: EditorLoadingProps) {
	return (
		<div
			aria-busy="true"
			className="flex min-h-0 min-w-0 flex-1 flex-col [&_[data-slot=skeleton]]:motion-reduce:animate-none"
		>
			<output className="sr-only">Loading editor</output>
			{withToolbar ? (
				<div
					aria-hidden="true"
					data-editor-skeleton="toolbar"
					className="@container/toolbar flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-background/95 px-3 py-1.5"
				>
					{TOOL_GROUPS.map((group, index) => (
						<div key={group[0]} className="flex items-center gap-2">
							{index > 0 ? (
								<span className="mx-1 hidden h-5 w-px bg-border @3xl/toolbar:block" />
							) : null}
							<div className="flex items-center gap-0.5">
								{group.map((tool) => (
									<Skeleton key={tool} className="size-8 rounded-lg" />
								))}
							</div>
						</div>
					))}
				</div>
			) : null}
			<div
				aria-hidden="true"
				data-editor-skeleton="body"
				className={cn(
					"min-h-0 flex-1 overflow-hidden",
					!withToolbar && "px-6 py-6 sm:px-8",
				)}
			>
				<div
					className={cn(
						"flex w-full flex-col gap-6",
						withToolbar ? "mx-auto max-w-3xl px-8 py-6" : "max-w-[68ch]",
					)}
				>
					{withToolbar ? <Skeleton className="h-7 w-2/5" /> : null}
					{["first", "second", "third"].map((paragraph) => (
						<div key={paragraph} className="flex flex-col gap-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-11/12" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					))}
				</div>
			</div>
			{withToolbar ? (
				<div
					aria-hidden="true"
					data-editor-skeleton="footer"
					className="flex h-9 shrink-0 items-center justify-between gap-3 border-t px-3 py-1"
				>
					<Skeleton className="h-7 w-24" />
					<Skeleton className="h-3 w-44 max-w-1/2" />
				</div>
			) : null}
		</div>
	);
}
