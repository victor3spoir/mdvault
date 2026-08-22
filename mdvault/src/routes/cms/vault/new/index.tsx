import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import { VaultEditor } from "#/features/vault/components/vault-editor";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";

const newAssetSearchSchema = z.object({
	type: z.string().default(""),
});

export const Route = createFileRoute("/cms/vault/new/")({
	validateSearch: zodValidator(newAssetSearchSchema),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(vaultConfigQueryOptions()),
	component: NewVaultAssetPage,
});

function NewVaultAssetPage() {
	const config = Route.useLoaderData();
	const { type } = Route.useSearch();
	const typeConfig = config.assetTypes.find(
		(candidate) => candidate.id === type,
	);

	if (!typeConfig) {
		return (
			<div className="p-8">
				<div className="space-y-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
					<p>Unknown asset type. Configure it in the settings first.</p>
					<Button asChild size="sm" variant="outline">
						<Link to="/cms/settings">Open Settings</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<VaultEditor
			typeConfig={typeConfig}
			locales={config.locales}
			defaultLocale={config.defaultLocale}
		/>
	);
}
