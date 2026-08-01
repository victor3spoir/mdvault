import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CmsSidebar } from "#/components/cms-sidebar";
import { CommandPalette } from "#/components/command-palette";
import { SiteHeader } from "#/components/site-header";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";

export const Route = createFileRoute("/cms")({
	component: CmsLayout,
});

function CmsLayout() {
	return (
		<SidebarProvider>
			<CmsSidebar />
			<SidebarInset className="overflow-visible">
				<div>
					<SiteHeader />
					<Outlet />
				</div>
			</SidebarInset>
			<CommandPalette />
		</SidebarProvider>
	);
}
