import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "#/components/page-layout";
import { UserProfileCard } from "#/features/settings/components/user-profile-card";
import { getGitHubUserFn } from "#/features/settings/settings.functions";

export const Route = createFileRoute("/cms/settings")({
	loader: () => getGitHubUserFn(),
	component: SettingsPage,
});

function SettingsPage() {
	const user = Route.useLoaderData();

	return (
		<PageLayout
			title="Settings"
			description="Repository and account information sourced from the configured GitHub token."
		>
			<UserProfileCard user={user} />
		</PageLayout>
	);
}
