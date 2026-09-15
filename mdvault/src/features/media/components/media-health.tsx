import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import type { MediaAudit } from "#/features/media/media.types";
import { MediaUsageLinks } from "./media-usage-links";

export function MediaHealth({ audit }: { audit: MediaAudit }) {
	if (!audit.missing.length)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No missing images</EmptyTitle>
					<EmptyDescription>
						All repository media references found in managed content resolve to
						an existing image.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-muted-foreground">
				These paths are referenced by content but absent from the media library.
				Open the entry to replace or remove the reference.
			</p>
			<ul className="divide-y rounded-xl border">
				{audit.missing.map((item) => (
					<li key={item.path} className="flex flex-col gap-2 p-4">
						<p className="break-all font-mono text-sm">{item.path}</p>
						<MediaUsageLinks entries={item.usedInEntries} />
					</li>
				))}
			</ul>
		</div>
	);
}
