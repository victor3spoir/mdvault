import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { GitHubUser } from "#/features/settings/settings.types";

interface UserProfileCardProps {
	user: GitHubUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>GitHub Account</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<img
						src={user.avatar_url}
						alt={user.login}
						className="h-18 w-18 rounded-full border object-cover"
					/>
					<div className="min-w-0 flex-1 space-y-1">
						<h2 className="text-xl font-semibold">{user.name || user.login}</h2>
						<p className="text-sm text-muted-foreground">@{user.login}</p>
						{user.bio ? (
							<p className="text-sm text-muted-foreground">{user.bio}</p>
						) : null}
						<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
							{user.location ? <span>{user.location}</span> : null}
							{user.company ? <span>{user.company}</span> : null}
							<span>{user.public_repos} public repos</span>
						</div>
					</div>
					<Button variant="outline" asChild>
						<a href={user.profile_url} target="_blank" rel="noreferrer">
							View Profile
						</a>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
