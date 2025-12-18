import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/features/shared/components/app-sidebar";
import type { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout;