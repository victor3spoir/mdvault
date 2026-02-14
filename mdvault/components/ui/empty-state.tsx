import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Route } from "next";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: Route | string;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-6 rounded-3xl p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button asChild size="lg" className="mt-2 h-12 rounded-2xl px-8 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95">
          <Link href={action.href as Route}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
