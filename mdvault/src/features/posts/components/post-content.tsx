/**
 * Posts are plain text where a single newline is a real line break, so the
 * reader mirrors the editor: one block per line, tight leading inside a line,
 * a small gap between lines and a larger one where the author left a blank
 * line. Markdown paragraph spacing would be far too airy for social copy.
 */
export function PostContent({ content }: { content: string }) {
	const lines = content.replace(/\r\n/g, "\n").split("\n");

	return (
		<div className="max-w-[68ch] text-[0.9375rem] leading-[1.55] text-foreground">
			{lines.map((line, index) => {
				const key = `${index}-${line.slice(0, 24)}`;

				if (line.trim().length === 0) {
					return <div key={key} aria-hidden="true" className="h-4" />;
				}

				return (
					<p key={key} className="mt-1 first:mt-0">
						{line}
					</p>
				);
			})}
		</div>
	);
}
