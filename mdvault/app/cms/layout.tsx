import type { ReactNode } from "react";
import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/features/shared/components/app-sidebar";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <Suspense fallback={<p>...</p>}>
        <AppSidebar />
      </Suspense>
      <Suspense fallback={<p>...</p>}>
        <SidebarInset className="overflow-hidden">{children}</SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
};

export default Layout;
