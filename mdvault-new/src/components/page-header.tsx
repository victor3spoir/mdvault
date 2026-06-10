import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	description?: string;
	actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 rounded-3xl border bg-card/70 p-6 backdrop-blur-sm lg:flex-row lg:items-start lg:justify-between">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
				{description ? (
					<p className="max-w-3xl text-sm text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>

			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
