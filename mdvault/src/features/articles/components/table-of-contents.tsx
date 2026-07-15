import { slugifyMarkdownHeading } from "#/features/content/components/markdown-content";
import { cn } from "#/lib/utils";

interface HeadingNode {
	id: string;
	title: string;
	level: number;
}

interface TableOfContentsProps {
	source: string;
}

function cleanHeadingTitle(value: string) {
	return value
		.replace(/\s+#+\s*$/g, "")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[*_~]/g, "")
		.trim();
}

function collectHeadings(source: string): HeadingNode[] {
	const headings: HeadingNode[] = [];
	const counts = new Map<string, number>();
	let insideFence = false;

	for (const line of source.split(/\r?\n/)) {
		if (/^\s*(```|~~~)/.test(line)) {
			insideFence = !insideFence;
			continue;
		}

		if (insideFence) {
			continue;
		}

		const match = /^(#{1,3})\s+(.+)$/.exec(line);
		if (!match) {
			continue;
		}

		const title = cleanHeadingTitle(match[2] ?? "");
		const baseId = slugifyMarkdownHeading(title) || "section";
		const count = counts.get(baseId) ?? 0;

		counts.set(baseId, count + 1);
		headings.push({
			id: count === 0 ? baseId : `${baseId}-${count + 1}`,
			title,
			level: match[1]?.length ?? 2,
		});
	}

	return headings;
}

export function TableOfContents({ source }: TableOfContentsProps) {
	const headings = collectHeadings(source);

	if (headings.length === 0) {
		return null;
	}

	return (
		<nav className="sticky top-20 space-y-3 rounded-xl border bg-card p-4">
			<h3 className="text-sm font-semibold text-foreground">
				Table of Contents
			</h3>
			<ul className="space-y-2 text-sm">
				{headings.map((heading) => (
					<li
						key={heading.id}
						style={{ marginLeft: `${Math.max(heading.level - 2, 0) * 12}px` }}
					>
						<a
							href={`#${heading.id}`}
							className={cn(
								"inline-block transition-colors duration-200",
								"text-muted-foreground hover:text-foreground",
							)}
						>
							{heading.title}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
