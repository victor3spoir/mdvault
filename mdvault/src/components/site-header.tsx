import { IconChevronRight, IconHome, IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";
import { cn } from "#/lib/utils";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

interface Breadcrumb {
	label: string;
	href?: string;
	search?: Record<string, string>;
}

const staticLabels: Record<string, string> = {
	articles: "Articles",
	posts: "Posts",
	media: "Media Library",
	settings: "Settings",
	vault: "Vault",
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

/**
 * Vault routes are type-scoped: the trail points back to the asset type list
 * (e.g. Projects) and carries the type search param so links stay resolvable.
 */
function buildVaultBreadcrumbs(
	segments: string[],
	vaultType: string,
	vaultLabel: string,
): Breadcrumb[] {
	const breadcrumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/cms" }];
	const rest = segments.slice(1);
	const isListPage = rest.length === 0;

	breadcrumbs.push({
		label: vaultLabel,
		href: isListPage ? undefined : "/cms/vault",
		search: isListPage ? undefined : { type: vaultType, searchQuery: "" },
	});

	const last = rest[rest.length - 1];
	if (last === "new") {
		breadcrumbs.push({ label: "New" });
	} else if (last === "edit") {
		breadcrumbs.push({ label: "Edit" });
	} else if (rest.length > 0) {
		breadcrumbs.push({ label: "Details" });
	}

	return breadcrumbs;
}

function buildBreadcrumbs(
	pathname: string,
	vaultType: string,
	vaultLabel: string,
): Breadcrumb[] {
	if (!pathname.startsWith("/cms")) {
		return [];
	}

	const segments = pathname.split("/").filter(Boolean).slice(1);
	const breadcrumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/cms" }];

	if (segments.length === 0) {
		return breadcrumbs;
	}

	if (segments[0] === "vault") {
		return buildVaultBreadcrumbs(segments, vaultType, vaultLabel);
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

/**
 * The header only earns a shadow once the content slides under it, so it stays
 * flat at rest and reads as a floating layer while scrolling.
 */
function useIsScrolled(threshold = 8) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const update = () => setScrolled(window.scrollY > threshold);

		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [threshold]);

	return scrolled;
}

export function SiteHeader() {
	const { pathname, search } = useLocation();
	const scrolled = useIsScrolled();
	const isVaultRoute = pathname.startsWith("/cms/vault");
	const vaultType = (search as { type?: string }).type ?? "";
	const config = useQuery({
		...vaultConfigQueryOptions(),
		enabled: isVaultRoute,
	});
	const vaultLabel =
		config.data?.assetTypes.find((type) => type.id === vaultType)?.label ??
		"Vault";
	const breadcrumbs = buildBreadcrumbs(pathname, vaultType, vaultLabel);

	const openCommandPalette = () => {
		window.dispatchEvent(new CustomEvent("command-palette:open"));
	};

	return (
		<header
			className={cn(
				// The inset layout offsets the main panel by 8px, so the sticky
				// threshold must match it or the header jumps up on first scroll.
				"sticky top-0 z-30 md:top-2",
				"flex h-16 items-center gap-3 px-4 sm:px-6 md:rounded-t-xl",
				"border-b bg-background/80 backdrop-blur-lg transition-shadow duration-200",
				// The panel does not clip, so that same 8px band needs an opaque
				// cover or scrolled content shows through above the header.
				"md:before:absolute md:before:inset-x-0 md:before:bottom-full md:before:h-2 md:before:bg-sidebar",
				scrolled ? "shadow-sm" : "shadow-none",
			)}
		>
			<SidebarTrigger className="shrink-0" />
			<Separator orientation="vertical" className="h-5 shrink-0" />

			<nav
				aria-label="Breadcrumb"
				className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground"
			>
				{breadcrumbs.map((crumb, index) => {
					const isFirst = index === 0;
					const isLast = index === breadcrumbs.length - 1;
					const isFoldable = !isFirst && !isLast;

					return (
						<span
							key={`${crumb.href ?? "current"}-${crumb.label}`}
							className={
								isFoldable
									? "hidden shrink-0 items-center gap-1.5 md:flex"
									: isLast && !isFirst
										? "flex min-w-0 items-center gap-1.5"
										: "flex shrink-0 items-center gap-1.5"
							}
						>
							{index > 0 && (
								<IconChevronRight className="size-3.5 shrink-0 opacity-60" />
							)}
							{isFirst ? (
								<Link
									to={crumb.href ?? "/cms"}
									aria-label="Dashboard"
									className="-m-1.5 flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground"
								>
									<IconHome className="size-4" />
								</Link>
							) : crumb.href ? (
								<Link
									to={crumb.href}
									search={crumb.search}
									className="truncate transition-colors hover:text-foreground"
								>
									{crumb.label}
								</Link>
							) : (
								<span
									aria-current="page"
									className="truncate font-medium text-foreground"
								>
									{crumb.label}
								</span>
							)}
						</span>
					);
				})}
			</nav>

			{/* Below sm the field would crowd out the trail, so it becomes its icon. */}
			<button
				type="button"
				onClick={openCommandPalette}
				aria-label="Search"
				className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
			>
				<IconSearch className="size-4" />
			</button>

			<button
				type="button"
				onClick={openCommandPalette}
				className="hidden w-full max-w-xs shrink items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex lg:max-w-md"
			>
				<IconSearch className="size-4 shrink-0" />
				<span className="truncate">Search articles, posts, media...</span>
				<kbd className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium lg:inline-block">
					⌘K
				</kbd>
			</button>
		</header>
	);
}
