import {
	IconArticle,
	IconHome,
	IconMessage2,
	IconPhoto,
	IconSettings,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Logo } from "#/components/logo";
import { ThemeToggle } from "#/components/theme-toggle";
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
	SidebarSeparator,
	useSidebar,
} from "#/components/ui/sidebar";
import { getGitHubUserFn } from "#/features/settings/settings.functions";
import type { GitHubUser } from "#/features/settings/settings.types";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";
import { getAssetIcon } from "#/features/vault/vault-icons";

interface NavItem {
	title: string;
	href: string;
	icon: ReactNode;
}

const navItems: NavItem[] = [
	{ title: "Dashboard", href: "/cms", icon: <IconHome className="size-4" /> },
];

const workspaceItems: NavItem[] = [
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

const contentItems: NavItem[] = [
	{
		title: "Articles",
		href: "/cms/articles",
		icon: <IconArticle className="size-4" />,
	},
	{
		title: "Posts",
		href: "/cms/posts",
		icon: <IconMessage2 className="size-4" />,
	},
];

function UserProfileFooter() {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const location = useLocation();
	const [user, setUser] = useState<GitHubUser | null>(null);

	useEffect(() => {
		if (!location.pathname.startsWith("/cms")) {
			return;
		}

		getGitHubUserFn()
			.then((data) => setUser(data))
			.catch(() => setUser(null));
	}, [location.pathname]);

	const displayName = useMemo(() => user?.name || "MDVault", [user?.name]);
	const handle = useMemo(
		() => `@${user?.login || "victor3spoir"}`,
		[user?.login],
	);

	return (
		<div
			className={
				isCollapsed
					? "flex flex-col items-center gap-2"
					: "flex items-center justify-between gap-2"
			}
		>
			<div
				className={
					isCollapsed
						? "flex items-center justify-center rounded-xl bg-muted/50 p-2"
						: "flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-muted/50 p-3"
				}
			>
				<div className="size-10 shrink-0 overflow-hidden rounded-full border bg-muted">
					{user?.avatar_url ? (
						<img
							src={user.avatar_url}
							alt={displayName}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-sm font-semibold">
							{displayName.slice(0, 1)}
						</div>
					)}
				</div>
				{!isCollapsed ? (
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-sm font-medium">{displayName}</span>
						<span className="truncate text-xs text-muted-foreground">
							{handle}
						</span>
					</div>
				) : null}
			</div>
			<ThemeToggle />
		</div>
	);
}

export function CmsSidebar() {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const { pathname } = useLocation();

	const isActive = (href: string) =>
		href === "/cms" ? pathname === href : pathname.startsWith(href);

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border px-4 py-4 h-16 group-data-[collapsible=icon]:px-0">
				<Link
					to="/cms"
					className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
				>
					<Logo />
					{!isCollapsed ? (
						<span className="text-xl font-bold tracking-tight">
							md<span className="text-primary">vault</span>
						</span>
					) : null}
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<NavLinkGroup label="Navigation" items={navItems} isActive={isActive} />

				<ContentSidebarGroup pathname={pathname} />

				<NavLinkGroup
					label="Workspace"
					items={workspaceItems}
					isActive={isActive}
				/>
			</SidebarContent>

			<SidebarSeparator />

			<SidebarFooter className="p-4">
				<UserProfileFooter />
			</SidebarFooter>
		</Sidebar>
	);
}

function NavLinkGroup({
	label,
	items,
	isActive,
}: {
	label: string;
	items: NavItem[];
	isActive: (href: string) => boolean;
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild isActive={isActive(item.href)}>
								<Link to={item.href}>
									{item.icon}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function ContentSidebarGroup({ pathname }: { pathname: string }) {
	const location = useLocation();
	const config = useQuery({
		...vaultConfigQueryOptions(),
		enabled: pathname.startsWith("/cms"),
	});
	const types = config.data?.assetTypes ?? [];

	const search = location.search as { type?: string };
	const activeType = pathname.startsWith("/cms/vault")
		? (search.type ?? null)
		: null;

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Content</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{contentItems.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								isActive={pathname.startsWith(item.href)}
							>
								<Link to={item.href}>
									{item.icon}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					{types.map((type) => {
						const Icon = getAssetIcon(type.icon);
						return (
							<SidebarMenuItem key={type.id}>
								<SidebarMenuButton asChild isActive={activeType === type.id}>
									<Link to="/cms/vault" search={{ type: type.id }}>
										<Icon className="size-4" />
										<span>{type.label}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
