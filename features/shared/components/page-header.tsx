"use client";

import { IconArrowLeft, IconChevronRight, IconDots } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface StatusBadge {
  label: string;
  variant?: "default" | "success" | "warning" | "muted";
  icon?: ReactNode;
}

export interface PageHeaderProps {
  breadcrumbs?: Breadcrumb[];
  backHref?: string;
  backLabel?: string;
  title?: string;
  status?: StatusBadge;
  actions?: ReactNode;
  menuItems?: ReactNode;
  showSidebarTrigger?: boolean;
}

const statusVariants = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  muted: "bg-muted text-muted-foreground",
};

export function PageHeader({
  breadcrumbs,
  backHref,
  backLabel = "Back",
  title,
  status,
  actions,
  menuItems,
  showSidebarTrigger = true,
}: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-3">
        {showSidebarTrigger && (
          <>
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
          </>
        )}

        {backHref && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                  asChild
                >
                  <Link href={backHref as "/"}>
                    <IconArrowLeft className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{backLabel}</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-5" />
          </>
        )}

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && (
                  <IconChevronRight className="size-3.5 text-muted-foreground/50" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href as "/"}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="max-w-50 truncate font-medium">
                    {title || crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {status && (
          <div className="ml-3">
            <Badge
              variant="secondary"
              className={`h-5 gap-1 rounded-full px-2 text-[10px] font-medium ${statusVariants[status.variant || "default"]}`}
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {menuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                <IconDots className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              {menuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
