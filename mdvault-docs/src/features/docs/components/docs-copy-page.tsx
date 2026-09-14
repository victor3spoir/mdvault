import {
	IconCheck,
	IconChevronDown,
	IconCopy,
	IconExternalLink,
	IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { docsConfig } from "../../../../content/docs/docs.config";

/**
 * "Copy page" — a split button.
 *
 * The default action copies the raw Markdown, because the most common reason a
 * reader wants a page as text is to paste it into an assistant. Copying the
 * rendered DOM instead produces a soup of stray whitespace and lost code
 * fences, which is exactly what makes the paste useless.
 *
 * The "as prompt" variant prepends the page URL and title so the model has a
 * citable source rather than an anonymous wall of text.
 */
export function DocsCopyPage({
	source,
	title,
	slug,
}: {
	source: string;
	title: string;
	slug: string;
}) {
	const [copied, setCopied] = useState(false);

	const copy = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	};

	const url = typeof window === "undefined" ? "" : window.location.href;
	const editUrl = docsConfig.editUrl?.(slug);

	return (
		<div className="flex items-center rounded-lg border">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => copy(source)}
				className="h-8 gap-1.5 rounded-r-none px-2.5 text-xs"
			>
				{copied ? (
					<IconCheck className="size-3.5 text-emerald-500" />
				) : (
					<IconCopy className="size-3.5" />
				)}
				{copied ? "Copied" : "Copy page"}
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						aria-label="More copy options"
						className="h-8 rounded-l-none border-l px-1.5"
					>
						<IconChevronDown className="size-3.5" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="min-w-56">
					<DropdownMenuItem onSelect={() => copy(source)}>
						<IconCopy className="size-4 text-muted-foreground" />
						Copy as Markdown
					</DropdownMenuItem>

					<DropdownMenuItem
						onSelect={() =>
							copy(
								`Read the OTApp documentation page "${title}"${
									url ? ` (${url})` : ""
								} and answer questions about it.\n\n---\n\n${source}`,
							)
						}
					>
						<IconSparkles className="size-4 text-muted-foreground" />
						Copy as prompt
					</DropdownMenuItem>

					{editUrl ? (
						<>
							<DropdownMenuSeparator />

							<DropdownMenuItem asChild>
								<a href={editUrl} target="_blank" rel="noreferrer">
									<IconExternalLink className="size-4 text-muted-foreground" />
									Edit this page
								</a>
							</DropdownMenuItem>
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
