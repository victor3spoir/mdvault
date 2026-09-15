import { EditorLoading } from "#/components/editor-loading";
import { Skeleton } from "#/components/ui/skeleton";

export function EditorPageLoading({
	rich = true,
	settings = false,
}: {
	rich?: boolean;
	settings?: boolean;
}) {
	return (
		<div
			data-editor-skeleton="page"
			className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-hidden bg-background [&_[data-slot=skeleton]]:motion-reduce:animate-none"
		>
			<div
				aria-hidden="true"
				className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4"
			>
				<div className="flex items-center gap-3">
					<Skeleton className="size-8 rounded-lg" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
				<div className="flex gap-1.5">
					{["source", "preview", "save", "settings"].map((action) => (
						<Skeleton key={action} className="size-8 rounded-lg" />
					))}
				</div>
			</div>
			<div className="flex min-h-0 flex-1 overflow-hidden">
				<div className="flex min-w-0 flex-1 flex-col">
					<div
						aria-hidden="true"
						data-editor-skeleton="title"
						className="flex shrink-0 flex-col gap-2 border-b px-8 py-3"
					>
						<Skeleton className="h-8 w-3/5 max-w-xl" />
						<Skeleton className="h-3.5 w-40" />
					</div>
					<EditorLoading withToolbar={rich} />
				</div>
				{settings ? (
					<div
						aria-hidden="true"
						data-editor-skeleton="settings"
						className="hidden w-80 shrink-0 flex-col border-l bg-muted/20 md:flex"
					>
						<div className="flex h-12 shrink-0 items-center border-b px-4">
							<Skeleton className="h-4 w-32" />
						</div>
						{["language", "description", "tags", "cover"].map((field) => (
							<div key={field} className="flex flex-col gap-3 border-b p-4">
								<Skeleton className="h-3 w-24" />
								<Skeleton
									className={
										field === "cover"
											? "aspect-video w-full"
											: field === "description"
												? "h-24 w-full"
												: "h-9 w-full"
									}
								/>
							</div>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}

export function PostEditorPageLoading() {
	return <EditorPageLoading rich={false} settings />;
}
