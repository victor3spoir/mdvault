import type { ReactNode } from "react";
import { type Breadcrumb, PageHeader, type StatusBadge } from "./page-header";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  backHref?: string;
  backLabel?: string;
  status?: StatusBadge;
  menuItems?: ReactNode;
}

const PageLayout = ({
  children,
  title,
  description,
  actions,
  breadcrumbs,
  backHref,
  backLabel,
  status,
  menuItems,
}: PageLayoutProps) => {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backHref={backHref}
        backLabel={backLabel}
        title={title}
        status={status}
        actions={actions}
        menuItems={menuItems}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;
