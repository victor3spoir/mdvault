import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { z } from "zod";
import { ContentFilterBar } from "#/components/content-filter-bar";
import { ContentListEmptyState } from "#/components/content-list-empty-state";
import { PageLayout } from "#/components/page-layout";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
	type ContentFilters,
	collectContentTags,
	contentFiltersSchema,
	DEFAULT_CONTENT_FILTERS,
	filterAndSortContent,
} from "#/features/shared/content-filters";
import { VaultAssetCard } from "#/features/vault/components/vault-asset-card";
import {
	vaultAssetsQueryOptions,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";
import { getAssetIcon } from "#/features/vault/vault-icons";

const vaultSearchSchema = contentFiltersSchema.extend({
	type: z.string().default(""),
});

export const Route = createFileRoute("/cms/vault/")({
	validateSearch: zodValidator(vaultSearchSchema),
	loaderDeps: ({ search }) => ({ type: search.type }),
	loader: async ({ context, deps }) => {
		const config = await context.queryClient.ensureQueryData(
			vaultConfigQueryOptions(),
		);
		const type = deps.type || config.assetTypes[0]?.id || "";
		if (type) {
			await context.queryClient.ensureQueryData(vaultAssetsQueryOptions(type));
		}
		return { config, type };
	},
	component: VaultListPage,
});

function VaultListPage() {
	const { config } = Route.useLoaderData();
	const navigate = useNavigate({ from: Route.fullPath });
	const search = Route.useSearch();
	const activeType = search.type || config.assetTypes[0]?.id || "";
	const typeConfig = config.assetTypes.find((type) => type.id === activeType);
	const label = typeConfig?.label ?? "Vault";

	const assets = useQuery({
		...vaultAssetsQueryOptions(activeType),
		enabled: Boolean(activeType),
	});

	const items = useMemo(() => assets.data ?? [], [assets.data]);
	const allTags = collectContentTags(items);
	const filtered = useMemo(
		() => filterAndSortContent(items, search),
		[items, search],
	);

	const updateFilters = (patch: Partial<ContentFilters>) => {
		navigate({ search: (prev) => ({ ...prev, ...patch }) });
	};

	const clearFilters = () => {
		navigate({
			search: (prev) => ({ ...DEFAULT_CONTENT_FILTERS, type: prev.type }),
		});
	};

	if (config.assetTypes.length === 0) {
		return (
			<PageLayout
				title="Vault"
				description="User-defined content types stored in your repository."
			>
				<ContentListEmptyState
					title="No asset types configured"
					description="Define your first asset type (notes, docs, tutorials...) in the settings."
					action={
						<Button asChild size="sm">
							<Link to="/cms/settings">Open Settings</Link>
						</Button>
					}
				/>
			</PageLayout>
		);
	}

	return (
		<PageLayout
			title={label}
			description={`Manage your ${label.toLowerCase()} stored in vault/${activeType}/.`}
			actions={
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
					>
						{filtered.length} {label}
					</Badge>
					<Button
						asChild
						size="sm"
						className="h-8 rounded-lg px-3 shadow-sm hover:shadow-md"
					>
						<Link
							to="/cms/vault/new"
							search={{ type: activeType }}
							className="gap-2"
						>
							<IconPlus className="size-4" />
							New {label.replace(/s$/i, "")}
						</Link>
					</Button>
				</div>
			}
		>
			<div className="flex flex-wrap items-center gap-2">
				{config.assetTypes.map((type) => {
					const Icon = getAssetIcon(type.icon);
					return (
						<Badge
							key={type.id}
							asChild
							variant={type.id === activeType ? "default" : "outline"}
							className="cursor-pointer rounded-lg px-3 py-1.5"
						>
							<button
								type="button"
								onClick={() =>
									navigate({ search: (prev) => ({ ...prev, type: type.id }) })
								}
							>
								<Icon className="mr-1 size-3.5" />
								{type.label}
							</button>
						</Badge>
					);
				})}
			</div>

			{items.length > 0 ? (
				<ContentFilterBar
					filters={search}
					onChange={updateFilters}
					label={label.toLowerCase()}
					availableTags={allTags}
				/>
			) : null}

			{assets.isLoading ? (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-6">
					{["vault-skeleton-1", "vault-skeleton-2", "vault-skeleton-3"].map(
						(id) => (
							<div key={id} className="overflow-hidden rounded-2xl border">
								<Skeleton className="aspect-video rounded-none" />
								<div className="space-y-3 p-5">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							</div>
						),
					)}
				</div>
			) : items.length === 0 ? (
				<ContentListEmptyState
					title={`No ${label.toLowerCase()} yet`}
					description="Create your first one to get started."
					action={
						<Button asChild size="sm">
							<Link to="/cms/vault/new" search={{ type: activeType }}>
								<IconPlus data-icon="inline-start" />
								Create
							</Link>
						</Button>
					}
				/>
			) : filtered.length === 0 ? (
				<ContentListEmptyState
					title={`No ${label.toLowerCase()} match these filters`}
					description="Try another search, status, language, or tag."
					action={
						<Button variant="outline" size="sm" onClick={clearFilters}>
							Clear filters
						</Button>
					}
				/>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-6">
					{filtered.map((asset) => (
						<VaultAssetCard key={asset.id} asset={asset} type={activeType} />
					))}
				</div>
			)}
		</PageLayout>
	);
}
