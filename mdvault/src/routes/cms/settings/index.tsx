import {
	IconBrandGithub,
	IconCircleCheck,
	IconKey,
	IconWorld,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { CopyToClipboard } from "#/features/settings/components/copy-to-clipboard";
import { UserProfileCard } from "#/features/settings/components/user-profile-card";
import { getSettingsPageDataFn } from "#/features/settings/settings.functions";

export const Route = createFileRoute("/cms/settings/")({
	loader: () => getSettingsPageDataFn(),
	component: SettingsPage,
});

function SettingsPage() {
	const loaderData = Route.useLoaderData();
	const hasSettingsData = "user" in loaderData;
	const user = hasSettingsData ? loaderData.user : loaderData;
	const repository = hasSettingsData
		? loaderData.repository
		: { owner: "", repo: "", branch: "main" };
	const site = hasSettingsData
		? loaderData.site
		: { name: "MDVault", url: "https://example.com" };

	return (
		<PageLayout
			title="Settings"
			description="Repository and account information sourced from the configured GitHub token."
		>
			<div className="space-y-8">
				<div className="space-y-3">
					<h3 className="text-sm font-semibold text-muted-foreground">
						Connected Account
					</h3>
					<UserProfileCard user={user} />
				</div>

				<Separator />

				<div className="rounded-xl border bg-card">
					<div className="flex items-center gap-3 border-b p-6">
						<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
							<IconBrandGithub className="size-5 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold">GitHub Repository</h2>
							<p className="text-sm text-muted-foreground">
								Configured repository (read-only)
							</p>
						</div>
					</div>
					<div className="space-y-4 bg-muted/30 p-6">
						<div className="rounded-lg border border-border/70 bg-background/60 p-4">
							<dl className="space-y-3">
								<div>
									<dt className="text-sm font-medium text-muted-foreground">
										Repository Owner
									</dt>
									<dd className="group flex items-center justify-between gap-3 text-sm font-mono text-foreground">
										<span>{repository.owner}</span>
										<CopyToClipboard
											value={repository.owner}
											className="opacity-0 transition-opacity group-hover:opacity-100"
										/>
									</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">
										Repository Name
									</dt>
									<dd className="group flex items-center justify-between gap-3 text-sm font-mono text-foreground">
										<span>{repository.repo}</span>
										<CopyToClipboard
											value={repository.repo}
											className="opacity-0 transition-opacity group-hover:opacity-100"
										/>
									</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">
										Branch
									</dt>
									<dd className="group flex items-center justify-between gap-3 text-sm font-mono text-foreground">
										<span>{repository.branch}</span>
										<CopyToClipboard
											value={repository.branch}
											className="opacity-0 transition-opacity group-hover:opacity-100"
										/>
									</dd>
								</div>
							</dl>
						</div>
						<p className="text-xs text-muted-foreground">
							Repository configuration is set through environment variables and
							cannot be changed here.
						</p>
					</div>
				</div>

				<div className="rounded-xl border bg-card">
					<div className="flex items-center gap-3 border-b p-6">
						<div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
							<IconKey className="size-5 text-amber-500" />
						</div>
						<div>
							<h2 className="font-semibold">GitHub Token</h2>
							<p className="text-sm text-muted-foreground">
								Server-side token configuration
							</p>
						</div>
					</div>
					<div className="space-y-4 bg-muted/30 p-6">
						<div className="rounded-lg border border-border/70 bg-background/60 p-4">
							<div className="space-y-2">
								<Label htmlFor="token">GitHub Personal Access Token</Label>
								<Input
									id="token"
									type="password"
									value="••••••••••••••••"
									readOnly
									disabled
									className="bg-muted"
								/>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<IconCircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
							<p className="text-xs text-muted-foreground">
								Token is stored securely in environment variables. No changes
								can be made through the UI.
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl border bg-card">
					<div className="flex items-center gap-3 border-b p-6">
						<div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
							<IconWorld className="size-5 text-blue-500" />
						</div>
						<div>
							<h2 className="font-semibold">Site Settings</h2>
							<p className="text-sm text-muted-foreground">
								General site configuration (coming soon)
							</p>
						</div>
					</div>
					<div className="space-y-4 p-6 opacity-60">
						<div className="space-y-2">
							<Label htmlFor="siteName">Site Name</Label>
							<Input id="siteName" value={site.name} readOnly disabled />
						</div>
						<div className="space-y-2">
							<Label htmlFor="siteUrl">Site URL</Label>
							<Input id="siteUrl" value={site.url} readOnly disabled />
						</div>
					</div>
				</div>
			</div>
		</PageLayout>
	);
}
