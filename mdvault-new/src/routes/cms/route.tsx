import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CmsSidebar } from "#/components/cms-sidebar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { SiteHeader } from "#/components/site-header";

export const Route = createFileRoute("/cms")({
	component: CmsLayout,
});

function CmsLayout() {
	return (
		<SidebarProvider>
			<CmsSidebar />
			<SidebarInset className="overflow-hidden">
				<div>
					<SiteHeader />
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
