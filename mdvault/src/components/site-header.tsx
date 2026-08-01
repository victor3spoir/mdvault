import { IconChevronRight, IconHome, IconSearch } from "@tabler/icons-react";
import { Link, useLocation } from "@tanstack/react-router";
import { Separator } from "./ui/separator";
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
		<header className="h-16 border-b bg-background/90 px-6 py-4 backdrop-blur sticky top-0 z-30">
			<div className="flex items-center gap-4">
				<div className="flex flex-1 items-center gap-3">
					<SidebarTrigger />
					<Separator orientation="vertical" className="h-5" />
					<nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
						{breadcrumbs.map((crumb, index) => (
							<span
								key={`${crumb.href ?? "current"}-${crumb.label}`}
								className="flex items-center gap-1.5"
							>
								{index > 0 && (
									<IconChevronRight className="size-3.5 opacity-60" />
								)}
								{index === 0 ? (
									<Link
										to={crumb.href ?? "/cms"}
										aria-label="Dashboard"
										className="flex items-center transition-colors hover:text-foreground"
									>
										<IconHome className="size-4" />
									</Link>
								) : crumb.href ? (
									<Link
										to={crumb.href}
										className="transition-colors hover:text-foreground"
									>
										{crumb.label}
									</Link>
								) : (
									<span className="font-medium text-foreground">
										{crumb.label}
									</span>
								)}
							</span>
						))}
					</nav>
				</div>

				<button
					type="button"
					onClick={() =>
						window.dispatchEvent(new CustomEvent("command-palette:open"))
					}
					className="flex w-full max-w-md items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<IconSearch className="size-4 shrink-0" />
					<span className="hidden sm:inline">
						Search articles, posts, media...
					</span>
					<kbd className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
						⌘K
					</kbd>
				</button>

				<div className="hidden flex-1 sm:block" />
			</div>
		</header>
	);
}
