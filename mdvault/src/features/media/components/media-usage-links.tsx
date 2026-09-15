import { Link } from "@tanstack/react-router";
import type { MediaUsageReference } from "#/features/media/media.types";

export function MediaUsageLinks({
	entries,
}: {
	entries: MediaUsageReference[];
}) {
	return (
		<ul className="flex flex-col gap-1 text-sm">
			{entries.map((entry) => (
				<li key={entry.path} className="min-w-0 break-words">
					<span className="text-muted-foreground">
						{entry.assetType ?? entry.type}:{" "}
					</span>
					{entry.type === "article" ? (
						<Link
							className="text-primary underline-offset-4 hover:underline"
							to="/cms/articles/$id/edit"
							params={{ id: entry.id }}
						>
							{entry.title}
						</Link>
					) : entry.type === "post" ? (
						<Link
							className="text-primary underline-offset-4 hover:underline"
							to="/cms/posts/$slug/edit"
							params={{ slug: entry.id }}
						>
							{entry.title}
						</Link>
					) : (
						<Link
							className="text-primary underline-offset-4 hover:underline"
							to="/cms/vault/$id/edit"
							params={{ id: entry.id }}
							search={{ type: entry.assetType ?? "" }}
						>
							{entry.title}
						</Link>
					)}
				</li>
			))}
		</ul>
	);
}
