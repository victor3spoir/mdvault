import { IconFileText } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * Shown when a collection has no content yet.
 *
 * This is a rare, first-time moment, so it earns a small staged entrance: the
 * icon settles in first, then the copy and the action. Everything animates
 * `opacity` and `translate` only, and the operating system's reduced-motion
 * preference caps it globally (see `styles.css`).
 */
export function ContentListEmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action: ReactNode;
}) {
	return (
		<section className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card/40 px-6 py-12 text-center">
			<div className="animate-in fade-in zoom-in-95 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground duration-300 ease-out">
				<IconFileText className="size-6" aria-hidden="true" />
			</div>
			<div className="animate-in fade-in slide-in-from-bottom-1 flex max-w-md flex-col gap-1.5 duration-300 delay-75 ease-out fill-mode-backwards">
				<h2 className="text-lg font-semibold tracking-tight text-balance">
					{title}
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground text-pretty">
					{description}
				</p>
			</div>
			<div className="animate-in fade-in slide-in-from-bottom-1 duration-300 delay-150 ease-out fill-mode-backwards">
				{action}
			</div>
		</section>
	);
}
