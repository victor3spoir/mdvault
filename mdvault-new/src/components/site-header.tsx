import { IconChevronRight } from "@tabler/icons-react";
import { Link, useLocation } from "@tanstack/react-router";
import { SidebarTrigger } from "./ui/sidebar";

interface Breadcrumb {
	label: string;
	href?: string;
}

const staticLabels: Record<string, string> = {
	articles: "Articles",
	posts: "Posts",
	media: "Media Library",
	settings: "Settings",
	new: "New",
	edit: "Edit",
};

function getDynamicLabel(previousSegment?: string) {
	if (previousSegment === "articles") {
		return "Article";
	}

	if (previousSegment === "posts") {
		return "Post";
	}

	return "Details";
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
	if (!pathname.startsWith("/cms")) {
		return [];
	}

	const segments = pathname.split("/").filter(Boolean).slice(1);
	const breadcrumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/cms" }];

	if (segments.length === 0) {
		return breadcrumbs;
	}

	let currentPath = "/cms";

	segments.forEach((segment, index) => {
		currentPath += `/${segment}`;
		const previousSegment = segments[index - 1];
		const isLast = index === segments.length - 1;
		const label =
			staticLabels[segment] ??
			(previousSegment === "articles" || previousSegment === "posts"
				? getDynamicLabel(previousSegment)
				: decodeURIComponent(segment).replace(/[-_]/g, " "));

		breadcrumbs.push({
			label,
			href: isLast ? undefined : currentPath,
		});
	});

	return breadcrumbs;
}

export function SiteHeader() {
	const { pathname } = useLocation();
	const breadcrumbs = buildBreadcrumbs(pathname);

	return (
		<header className="border-b bg-background/90 px-6 py-4 backdrop-blur">
			<div className="flex items-center gap-4">
				<SidebarTrigger className="mt-0.5" />
				<nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
					{breadcrumbs.map((crumb, index) => (
						<span
							key={`${crumb.href ?? "current"}-${crumb.label}`}
							className="flex items-center gap-1.5"
						>
							{index > 0 && (
								<IconChevronRight className="size-3.5 opacity-60" />
							)}
							{crumb.href ? (
								<Link
									to={crumb.href}
									className="transition-colors hover:text-foreground"
								>
									{crumb.label}
								</Link>
							) : (
								<span className="font-medium text-foreground">{crumb.label}</span>
							)}
						</span>
					))}
				</nav>
			</div>
		</header>
	);
}
