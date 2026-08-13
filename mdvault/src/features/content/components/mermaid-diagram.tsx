import { useEffect, useId, useRef, useState } from "react";
import { cn } from "#/lib/utils";

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

/**
 * Loads and configures Mermaid once, on demand.
 *
 * The library is heavy and most documents contain no diagrams, so it is only
 * pulled in when one is actually rendered.
 */
function loadMermaid(isDark: boolean) {
	if (!mermaidReady) {
		mermaidReady = import("mermaid").then(({ default: mermaid }) => {
			mermaid.initialize({
				startOnLoad: false,
				// User content is untrusted: `strict` blocks the HTML labels and
				// click handlers that Mermaid would otherwise allow through.
				securityLevel: "strict",
				theme: isDark ? "dark" : "default",
				fontFamily: "inherit",
			});
			return mermaid;
		});
	}

	return mermaidReady;
}

function prefersDark() {
	return (
		typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark")
	);
}

/**
 * Renders a Mermaid diagram, falling back to the original source when the
 * definition does not parse - a half-written diagram should show what was
 * written, not an empty box.
 */
export function MermaidDiagram({
	chart,
	className,
}: {
	chart: string;
	className?: string;
}) {
	const id = useId().replace(/:/g, "");
	const [svg, setSvg] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let cancelled = false;
		const source = chart.trim();

		if (!source) {
			setSvg(null);
			setError(null);
			return;
		}

		loadMermaid(prefersDark())
			.then((mermaid) => mermaid.render(`mermaid-${id}`, source))
			.then(({ svg: rendered }) => {
				if (!cancelled) {
					setSvg(rendered);
					setError(null);
				}
			})
			.catch((cause: unknown) => {
				if (!cancelled) {
					setSvg(null);
					setError(cause instanceof Error ? cause.message : "Invalid diagram");
				}
			});

		return () => {
			cancelled = true;
		};
	}, [chart, id]);

	if (error) {
		return (
			<figure
				className={cn("my-6 overflow-hidden rounded-2xl border", className)}
			>
				<pre className="overflow-x-auto p-5 text-sm leading-7">
					<code>{chart}</code>
				</pre>
				<figcaption className="border-t bg-muted/40 px-5 py-2 text-xs text-muted-foreground">
					Diagram could not be rendered: {error}
				</figcaption>
			</figure>
		);
	}

	const wrapperClass = cn(
		"my-6 flex justify-center overflow-x-auto rounded-2xl border bg-card p-5 [&_svg]:h-auto [&_svg]:max-w-full",
		className,
	);

	if (!svg) {
		return (
			<div ref={container} className={wrapperClass}>
				<span className="text-sm text-muted-foreground">
					Rendering diagram…
				</span>
			</div>
		);
	}

	return (
		<div
			ref={container}
			className={wrapperClass}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid generated this SVG itself under securityLevel "strict"
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
