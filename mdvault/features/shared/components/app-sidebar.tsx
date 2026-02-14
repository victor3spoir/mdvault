"use client";

import {
  IconBrandGithub,
  IconChevronDown,
  IconChevronRight,
  IconFileText,
  IconHome,
  IconList,
  IconPhoto,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/cms",
    icon: <IconHome className="size-4" />,
  },
  {
    title: "Articles",
    icon: <IconFileText className="size-4" />,
    children: [
      { title: "All Articles", href: "/cms/articles" },
      { title: "New Article", href: "/cms/articles/new" },
    ],
  },
  {
    title: "Posts",
    icon: <IconFileText className="size-4" />,
    children: [
      { title: "All Posts", href: "/cms/posts" },
      { title: "New Post", href: "/cms/posts/new" },
    ],
  },
  {
    title: "Media",
    href: "/cms/media",
    icon: <IconPhoto className="size-4" />,
  },
  {
    title: "Settings",
    href: "/cms/settings",
    icon: <IconSettings className="size-4" />,
  },
];

const AppSidebar = () => {
  const [pathname, setPathname] = useState<string | null>(null);
  const actualPathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(["Articles"]);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Defer pathname access to hydration
  useEffect(() => {
    setPathname(actualPathname);
  }, [actualPathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isActive = (href?: string) => {
    if (!href || !pathname) return false;
    return pathname === href;
  };

  const isChildActive = (item: NavItem) => {
    if (!item.children || !pathname) return false;
    return item.children.some((child) => pathname === child.href);
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <div className="px-4 py-2">
        <SidebarTrigger />
      </div>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/cms" className="flex items-center gap-3">
            <Logo />
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight">
                md<span className="text-primary">vault</span>
              </span>
            )}
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <>
                      <SidebarMenuButton
                        onClick={() => toggleMenu(item.title)}
                        isActive={isChildActive(item)}
                        className="justify-between"
                      >
                        <span className="flex items-center gap-2">
                          {item.icon}
                          <span>{item.title}</span>
                        </span>
                        {openMenus.includes(item.title) ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                      </SidebarMenuButton>
                      <SidebarMenuSub
                        className={cn(
                          "transition-all duration-200",
                          openMenus.includes(item.title) ? "block" : "hidden",
                        )}
                      >
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(child.href)}
                            >
                              <Link href={child.href as "/"}>
                                {child.title === "New Article" && (
                                  <IconPlus className="size-3" />
                                )}
                                {child.title === "All Articles" && (
                                  <IconList className="size-3" />
                                )}
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={(item.href ?? "/") as "/"}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div
          className={cn(
            "flex gap-2",
            isCollapsed
              ? "flex-col items-center"
              : "items-center justify-between",
          )}
        >
          <div
            className={cn(
              "flex items-center rounded-lg bg-muted/50",
              isCollapsed ? "p-2 justify-center" : "gap-3 flex-1 p-3 min-w-0",
            )}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <IconBrandGithub className="size-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-xs min-w-0">
                <span className="font-medium">Connected</span>
                <span className="text-muted-foreground truncate">
                  GitHub Repository
                </span>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
