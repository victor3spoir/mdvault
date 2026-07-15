"use client";

import {
	IconChevronDown,
	IconChevronRight,
	IconFileText,
	IconHome,
	IconList,
	IconPhoto,
	IconPlus,
	IconSettings,
} from "@tabler/icons-react";
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
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarSeparator,
	useSidebar,
} from "#/components/ui/sidebar";
import { getGitHubUserFn } from "#/features/settings/settings.functions";
import type { GitHubUser } from "#/features/settings/settings.types";

interface NavItem {
	title: string;
	href?: string;
	icon: ReactNode;
	children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
	{ title: "Dashboard", href: "/cms", icon: <IconHome className="size-4" /> },
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
	const [openMenus, setOpenMenus] = useState<string[]>(["Articles"]);
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const { pathname } = useLocation();

	const toggleMenu = (title: string) => {
		setOpenMenus((prev) =>
			prev.includes(title)
				? prev.filter((value) => value !== title)
				: [...prev, title],
		);
	};

	const isActive = (href?: string) => !!href && pathname === href;
	const isChildActive = (item: NavItem) =>
		!!item.children?.some((child) => pathname === child.href);

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border px-4 py-4 h-16">
				<Link to="/cms" className="flex items-center gap-3">
					<Logo />
					{!isCollapsed ? (
						<span className="text-xl font-bold tracking-tight">
							md<span className="text-primary">vault</span>
						</span>
					) : null}
				</Link>
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
												className={
													openMenus.includes(item.title) ? "block" : "hidden"
												}
											>
												{item.children.map((child) => (
													<SidebarMenuSubItem key={child.href}>
														<SidebarMenuSubButton
															asChild
															isActive={isActive(child.href)}
														>
															<Link to={child.href}>
																{child.title === "New Article" ? (
																	<IconPlus className="size-3" />
																) : null}
																{child.title === "All Articles" ? (
																	<IconList className="size-3" />
																) : null}
																{child.title === "New Post" ? (
																	<IconPlus className="size-3" />
																) : null}
																{child.title === "All Posts" ? (
																	<IconList className="size-3" />
																) : null}
																<span>{child.title}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</>
									) : (
										<SidebarMenuButton asChild isActive={isActive(item.href)}>
											<Link to={item.href ?? "/cms"}>
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
				<UserProfileFooter />
			</SidebarFooter>
		</Sidebar>
	);
}
