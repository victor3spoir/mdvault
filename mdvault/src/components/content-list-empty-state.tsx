import { IconFileText } from "@tabler/icons-react";
import type { ReactNode } from "react";

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
			<div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
				<IconFileText className="size-6" aria-hidden="true" />
			</div>
			<div className="flex max-w-md flex-col gap-1.5">
				<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
			{action}
		</section>
	);
}
