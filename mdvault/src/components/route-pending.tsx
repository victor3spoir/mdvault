import { Skeleton } from "#/components/ui/skeleton";

const CARD_KEYS = [
	"route-skeleton-1",
	"route-skeleton-2",
	"route-skeleton-3",
	"route-skeleton-4",
	"route-skeleton-5",
	"route-skeleton-6",
];

/**
 * Default route pending state. Mirrors the PageLayout structure (header +
 * content) so navigation keeps the page shape instead of flashing a spinner.
 * Routes with a tailored skeleton keep their own pendingComponent.
 */
export function RoutePending() {
	return (
		<div className="flex min-h-screen flex-1 flex-col bg-background">
			<main className="flex-1 p-6">
				<div className="space-y-6">
					<header className="flex flex-col gap-4 py-1 lg:flex-row lg:items-start lg:justify-between">
						<div className="flex flex-col gap-1.5">
							<Skeleton className="h-9 w-56" />
							<Skeleton className="h-4 w-80 max-w-full" />
						</div>
						<div className="flex shrink-0 items-center gap-2 lg:pt-0.5">
							<Skeleton className="h-6 w-20 rounded-lg" />
							<Skeleton className="h-8 w-32 rounded-lg" />
						</div>
					</header>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<Skeleton className="h-11 flex-1 rounded-2xl" />
						<div className="flex gap-3">
							<Skeleton className="h-11 w-35 rounded-2xl" />
							<Skeleton className="h-11 w-40 rounded-2xl" />
							<Skeleton className="size-11 rounded-2xl" />
						</div>
					</div>

					<div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
						{CARD_KEYS.map((key) => (
							<div key={key} className="overflow-hidden rounded-2xl border">
								<Skeleton className="aspect-video rounded-none" />
								<div className="space-y-3 p-5">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
