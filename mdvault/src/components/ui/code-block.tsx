import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { highlighter } from "#/lib/highlight";

interface CodeBlockProps {
	children: string;
	language: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const highlighted = useMemo(
		() => highlighter.highlight(children, { lang: language }),
		[children, language],
	);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(children);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	return (
		<div className="group code-block relative my-6 overflow-hidden rounded-2xl border">
			<pre className="overflow-x-auto p-5 text-sm leading-7">
				<code
					// biome-ignore lint/security/noDangerouslySetInnerHtml: output comes from TanStack Highlight, which escapes source text
					dangerouslySetInnerHTML={{ __html: highlighted.html }}
				/>
			</pre>
			<div className="absolute top-3 right-3 flex items-center gap-2">
				<Button
					type="button"
					onClick={handleCopy}
					size="icon-sm"
					variant="secondary"
					className="border bg-background/60 backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100"
					title="Copy code"
				>
					{copied ? (
						<IconCheck className="size-4 text-emerald-500" />
					) : (
						<IconCopy className="size-4" />
					)}
				</Button>
				{language !== "text" && language !== "plaintext" ? (
					<div className="rounded-md border bg-background/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
						{language}
					</div>
				) : null}
			</div>
		</div>
	);
}
