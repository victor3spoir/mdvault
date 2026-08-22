import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import { VaultEditor } from "#/features/vault/components/vault-editor";
import {
	vaultAssetQueryOptions,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";

const editAssetSearchSchema = z.object({
	type: z.string().default(""),
});

export const Route = createFileRoute("/cms/vault/$id/edit/")({
	validateSearch: zodValidator(editAssetSearchSchema),
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
	component: EditVaultAssetPage,
});

function EditVaultAssetPage() {
	const { config, asset } = Route.useLoaderData();
	const { type } = Route.useSearch();
	const typeConfig = config.assetTypes.find(
		(candidate) => candidate.id === type,
	);

	if (!typeConfig || !asset) {
		return (
			<div className="p-8">
				<div className="space-y-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					<p>
						{typeConfig
							? "The requested asset could not be loaded."
							: "Unknown asset type."}
					</p>
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
		<VaultEditor
			typeConfig={typeConfig}
			asset={asset}
			locales={config.locales}
			defaultLocale={config.defaultLocale}
		/>
	);
}
