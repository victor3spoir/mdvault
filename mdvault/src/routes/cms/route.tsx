import {
	IconAlertTriangle,
	IconHome,
	IconRefresh,
	IconRotateClockwise,
} from "@tabler/icons-react";
import {
	createFileRoute,
	type ErrorComponentProps,
	Link,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CmsSidebar } from "#/components/cms-sidebar";
import { CommandPalette } from "#/components/command-palette";
import { SiteHeader } from "#/components/site-header";
import { Button } from "#/components/ui/button";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";

export const Route = createFileRoute("/cms")({
	component: CmsLayout,
	errorComponent: CmsErrorComponent,
});

function CmsShell({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider>
			<CmsSidebar />
			<SidebarInset className="overflow-visible">
				<div>
					<SiteHeader />
					{children}
				</div>
			</SidebarInset>
			<CommandPalette />
		</SidebarProvider>
	);
}

function CmsLayout() {
	return (
		<CmsShell>
			<Outlet />
		</CmsShell>
	);
}

function CmsErrorComponent({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	const handleRetry = async () => {
		reset();
		await router.invalidate();
	};

	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<CmsShell>
			<div className="flex min-h-[60dvh] items-center justify-center px-4">
				<div className="max-w-md space-y-6 text-center">
					<div className="flex justify-center">
						<div className="relative rounded-full border border-destructive/20 bg-destructive/10 p-5">
							<div className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl" />
							<IconAlertTriangle className="relative mx-auto size-12 text-destructive" />
						</div>
					</div>

					<div className="space-y-3">
						<h1 className="text-3xl font-bold">Something Went Wrong</h1>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{error.message ||
								"An unexpected error occurred while loading this page."}
						</p>
					</div>

					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<Button onClick={handleRetry}>
							<IconRotateClockwise className="size-4" />
							Retry
						</Button>
						<Button variant="outline" onClick={handleRefresh}>
							<IconRefresh className="size-4" />
							Refresh Page
						</Button>
						<Button asChild variant="outline">
							<Link to="/cms">
								<IconHome className="size-4" />
								Go Home
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</CmsShell>
	);
}
