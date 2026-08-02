import {
	IconArticle,
	IconFileText,
	IconLayoutDashboard,
	IconPhotoPlus,
	IconPlus,
	IconSearch,
	IconSettings,
} from "@tabler/icons-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import { postsListQueryOptions } from "#/features/posts/posts.queries";
import {
	vaultAssetsQueryOptions,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";
import { getAssetIcon } from "#/features/vault/vault-icons";
import { cn } from "#/lib/utils";

declare global {
	interface WindowEventMap {
		"command-palette:open": CustomEvent;
	}
}

type CommandItem = {
	id: string;
	label: string;
	hint?: string;
	group: string;
	icon: ReactNode;
	keywords: string;
	run: () => void;
};

export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const navigate = useNavigate();
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const articles = useQuery({ ...articlesListQueryOptions(), enabled: open });
	const posts = useQuery({ ...postsListQueryOptions(), enabled: open });
	const vaultConfig = useQuery({ ...vaultConfigQueryOptions(), enabled: open });
	const assetTypes = useMemo(
		() => vaultConfig.data?.assetTypes ?? [],
		[vaultConfig.data],
	);
	const vaultAssets = useQueries({
		queries: assetTypes.map((type) => ({
			...vaultAssetsQueryOptions(type.id),
			enabled: open,
		})),
		combine: (results) => results.map((result) => result.data ?? []),
	});

	const close = useCallback(() => {
		setOpen(false);
		setQuery("");
		setActiveIndex(0);
	}, []);

	const go = useCallback(
		(action: () => void) => {
			close();
			action();
		},
		[close],
	);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((value) => !value);
			}
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		function handleOpen() {
			setOpen(true);
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("command-palette:open", handleOpen);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("command-palette:open", handleOpen);
		};
	}, []);

	const items = useMemo<CommandItem[]>(() => {
		const navItems: CommandItem[] = [
			{
				id: "nav-new-article",
				label: "New Article",
				group: "Actions",
				icon: <IconPlus className="size-4" />,
				keywords: "create write new article",
				run: () => go(() => navigate({ to: "/cms/articles/new" })),
			},
			{
				id: "nav-new-post",
				label: "New Post",
				group: "Actions",
				icon: <IconPlus className="size-4" />,
				keywords: "create write new post",
				run: () => go(() => navigate({ to: "/cms/posts/new" })),
			},
			{
				id: "nav-dashboard",
				label: "Dashboard",
				group: "Navigation",
				icon: <IconLayoutDashboard className="size-4" />,
				keywords: "home overview dashboard",
				run: () => go(() => navigate({ to: "/cms" })),
			},
			{
				id: "nav-media",
				label: "Media Library",
				group: "Navigation",
				icon: <IconPhotoPlus className="size-4" />,
				keywords: "images media library assets",
				run: () => go(() => navigate({ to: "/cms/media" })),
			},
			{
				id: "nav-settings",
				label: "Settings",
				group: "Navigation",
				icon: <IconSettings className="size-4" />,
				keywords: "settings config profile",
				run: () => go(() => navigate({ to: "/cms/settings" })),
			},
		];

		const articleItems: CommandItem[] = (articles.data ?? []).map(
			(article) => ({
				id: `article-${article.id}`,
				label: article.title,
				hint: article.published ? "Published" : "Draft",
				group: "Articles",
				icon: <IconArticle className="size-4" />,
				keywords: `${article.title} ${article.tags?.join(" ") ?? ""}`,
				run: () =>
					go(() =>
						navigate({
							to: "/cms/articles/$id/edit",
							params: { id: article.id },
						}),
					),
			}),
		);

		const postItems: CommandItem[] = (posts.data ?? []).map((post) => ({
			id: `post-${post.id}`,
			label: post.title,
			hint: post.published ? "Published" : "Draft",
			group: "Posts",
			icon: <IconFileText className="size-4" />,
			keywords: post.title,
			run: () =>
				go(() =>
					navigate({ to: "/cms/posts/$slug/edit", params: { slug: post.id } }),
				),
		}));

		const vaultNavItems: CommandItem[] = assetTypes.flatMap((type) => {
			const Icon = getAssetIcon(type.icon);
			const singular = type.label.replace(/s$/i, "");
			return [
				{
					id: `nav-new-${type.id}`,
					label: `New ${singular}`,
					group: "Actions",
					icon: <IconPlus className="size-4" />,
					keywords: `create new ${type.label} ${type.id}`,
					run: () =>
						go(() =>
							navigate({ to: "/cms/vault/new", search: { type: type.id } }),
						),
				},
				{
					id: `nav-${type.id}`,
					label: type.label,
					group: "Navigation",
					icon: <Icon className="size-4" />,
					keywords: `${type.label} ${type.id} vault content`,
					run: () =>
						go(() => navigate({ to: "/cms/vault", search: { type: type.id } })),
				},
			];
		});

		const vaultItems: CommandItem[] = assetTypes.flatMap((type, index) => {
			const Icon = getAssetIcon(type.icon);
			return (vaultAssets[index] ?? []).map((asset) => ({
				id: `vault-${type.id}-${asset.id}`,
				label: asset.title,
				hint: asset.published ? "Published" : "Draft",
				group: type.label,
				icon: <Icon className="size-4" />,
				keywords: `${asset.title} ${asset.tags?.join(" ") ?? ""} ${type.label}`,
				run: () =>
					go(() =>
						navigate({
							to: "/cms/vault/$id/edit",
							params: { id: asset.id },
							search: { type: type.id },
						}),
					),
			}));
		});

		return [
			...navItems,
			...vaultNavItems,
			...articleItems,
			...postItems,
			...vaultItems,
		];
	}, [articles.data, posts.data, assetTypes, vaultAssets, navigate, go]);

	const filtered = useMemo(() => {
		const term = query.trim().toLowerCase();
		if (!term) {
			return items;
		}
		return items.filter((item) =>
			`${item.label} ${item.keywords}`.toLowerCase().includes(term),
		);
	}, [items, query]);

	const grouped = useMemo(() => {
		const map = new Map<string, CommandItem[]>();
		for (const item of filtered) {
			const list = map.get(item.group) ?? [];
			list.push(item);
			map.set(item.group, list);
		}
		return Array.from(map.entries());
	}, [filtered]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when the result set changes
	useEffect(() => {
		setActiveIndex(0);
	}, [query, open]);

	const handleListKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((index) => Math.max(index - 1, 0));
		} else if (event.key === "Enter") {
			event.preventDefault();
			filtered[activeIndex]?.run();
		}
	};

	useEffect(() => {
		listRef.current
			?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
			?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
		}
	}, [open]);

	if (!open) {
		return null;
	}

	let runningIndex = -1;

	return (
		<div className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-[12vh]">
			<button
				type="button"
				aria-label="Close command palette"
				className="fixed inset-0 bg-black/40 backdrop-blur-sm"
				onClick={close}
			/>
			<div
				className="relative w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-label="Command palette"
			>
				<div className="flex items-center gap-3 border-b px-4">
					<IconSearch className="size-4 shrink-0 text-muted-foreground" />
					<input
						ref={inputRef}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={handleListKeyDown}
						placeholder="Search articles, posts, content..."
						className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					/>
					<kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
						ESC
					</kbd>
				</div>

				<div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
					{filtered.length === 0 ? (
						<div className="px-3 py-8 text-center text-sm text-muted-foreground">
							No results found.
						</div>
					) : (
						grouped.map(([group, groupItems]) => (
							<div key={group} className="mb-1">
								<div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									{group}
								</div>
								{groupItems.map((item) => {
									runningIndex += 1;
									const index = runningIndex;
									return (
										<button
											key={item.id}
											type="button"
											data-index={index}
											onClick={item.run}
											onMouseMove={() => setActiveIndex(index)}
											className={cn(
												"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
												index === activeIndex
													? "bg-accent text-accent-foreground"
													: "text-foreground",
											)}
										>
											<span className="text-muted-foreground">{item.icon}</span>
											<span className="flex-1 truncate">{item.label}</span>
											{item.hint ? (
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{item.hint}
												</span>
											) : null}
										</button>
									);
								})}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
