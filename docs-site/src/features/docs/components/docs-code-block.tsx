import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { HTMLAttributes } from "react";
import { useRef, useState } from "react";
import { cn } from "#/lib/utils";

/**
 * Wraps every fence with a language label and a copy button.
 *
 * The highlighted markup arrives from the server through
 * `dangerouslySetInnerHTML` on the inner `<code>`, so this component reads the
 * text back off the DOM node rather than being handed the source: adding a
 * second copy of every snippet to the payload just to support a copy button
 * would roughly double the page weight.
 */
export function DocsCodeBlock({
	className,
	children,
	...props
}: HTMLAttributes<HTMLPreElement> & { "data-lang"?: string }) {
	const ref = useRef<HTMLPreElement>(null);
	const [copied, setCopied] = useState(false);
	const lang = props["data-lang"];

	const copy = async () => {
		const text = ref.current?.textContent ?? "";
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	};

	return (
		<div className="group relative my-6">
			{lang && lang !== "plaintext" ? (
				<span className="pointer-events-none absolute top-2.5 left-4 font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase">
					{lang}
				</span>
			) : null}

			<button
				type="button"
				onClick={copy}
				aria-label={copied ? "Copied" : "Copy code"}
				className="absolute top-2 right-2 z-10 rounded-md border border-border/60 bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				{copied ? (
					<IconCheck className="size-3.5 text-emerald-500" />
				) : (
					<IconCopy className="size-3.5" />
				)}
			</button>

			<pre
				ref={ref}
				className={cn(
					"th-code overflow-x-auto rounded-xl border border-border/60 bg-muted/40 px-4 pt-8 pb-4 text-[13px] leading-relaxed",
					className,
				)}
				{...props}
			>
				{children}
			</pre>
		</div>
	);
}
