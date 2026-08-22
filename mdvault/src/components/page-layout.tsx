import type { ReactNode } from "react";
import { PageHeader } from "#/components/page-header";

interface PageLayoutProps {
	children: ReactNode;
	title: string;
	description?: string;
	actions?: ReactNode;
}

export function PageLayout({
	children,
	title,
	description,
	actions,
}: PageLayoutProps) {
	return (
		<div className="flex min-h-[calc(100svh-4rem)] flex-1 flex-col bg-background">
			<main className="flex-1 p-6">
				<div className="space-y-6">
					<PageHeader
						title={title}
						description={description}
						actions={actions}
					/>
					{children}
				</div>
			</main>
		</div>
	);
}
