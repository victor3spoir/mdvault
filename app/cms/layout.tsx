import type { ReactNode } from "react";
import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/features/shared/components/app-sidebar";

const LayoutContent = ({ children }: { children: ReactNode }) => (
  <>
    <AppSidebar />
    <SidebarInset>
      <div>{children}</div>
    </SidebarInset>
  </>
);

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center bg-muted">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        }
      >
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </SidebarProvider>
  );
};

export default Layout;
