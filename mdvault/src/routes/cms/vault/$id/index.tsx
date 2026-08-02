import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { MarkdownContent } from "#/features/content/components/markdown-content";
import { PrivateImage } from "#/features/media/components/private-image";
import {
	vaultAssetQueryOptions,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";
import { formatDate } from "#/lib/date";

const viewAssetSearchSchema = z.object({
	type: z.string().default(""),
});

export const Route = createFileRoute("/cms/vault/$id/")({
	validateSearch: zodValidator(viewAssetSearchSchema),
	loaderDeps: ({ search }) => ({ type: search.type }),
	loader: async ({ context, params, deps }) => {
		const config = await context.queryClient.ensureQueryData(
			vaultConfigQueryOptions(),
		);
		const asset = deps.type
			? await context.queryClient.ensureQueryData(
					vaultAssetQueryOptions(deps.type, params.id),
				)
			: null;
		return { config, asset };
	},
	component: ViewVaultAssetPage,
});

function ViewVaultAssetPage() {
	const { config, asset } = Route.useLoaderData();
	const { type } = Route.useSearch();
	const typeConfig = config.assetTypes.find(
		(candidate) => candidate.id === type,
	);

	if (!asset || !typeConfig) {
		return (
			<div className="p-8">
				<div className="space-y-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					<p>The requested asset could not be loaded.</p>
					<Button asChild size="sm" variant="outline">
						<Link to="/cms/vault" search={{ type, searchQuery: "" }}>
							Back to Vault
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-3xl px-6 py-8">
			<div className="mb-6 flex items-center justify-between">
				<Button asChild variant="ghost" size="sm" className="gap-2">
					<Link to="/cms/vault" search={{ type, searchQuery: "" }}>
						<IconArrowLeft className="size-4" />
						{typeConfig.label}
					</Link>
				</Button>
				<Button asChild size="sm" variant="outline" className="gap-2">
					<Link
						to="/cms/vault/$id/edit"
						params={{ id: asset.id }}
						search={{ type }}
					>
						<IconEdit className="size-4" />
						Edit
					</Link>
				</Button>
			</div>

			<div className="mb-6 space-y-3">
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className={
							asset.published
								? "h-5 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
								: "h-5 rounded-full bg-amber-500/10 px-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"
						}
					>
						{asset.published ? "Published" : "Draft"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{formatDate(asset.createdAt)}
						{asset.author ? ` · By ${asset.author}` : ""}
					</span>
				</div>
				<h1 className="text-4xl font-bold tracking-tight">{asset.title}</h1>
				{asset.description ? (
					<p className="text-lg text-muted-foreground">{asset.description}</p>
				) : null}
				{asset.tags && asset.tags.length > 0 ? (
					<div className="flex flex-wrap gap-1.5">
						{asset.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
							>
								#{tag}
							</span>
						))}
					</div>
				) : null}
			</div>

			{asset.coverImage ? (
				<div className="mb-8 overflow-hidden rounded-2xl border bg-muted">
					<PrivateImage
						src={asset.coverImage}
						alt={asset.title}
						className="max-h-[24rem] w-full object-cover"
					/>
				</div>
			) : null}

			<article>
				<MarkdownContent source={asset.content} />
			</article>
		</div>
	);
}
