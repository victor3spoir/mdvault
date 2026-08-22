import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Renders a ```mermaid fence as a diagram.
 *
 * Mermaid is ~500 kB and parses its own grammar, so it is loaded with a
 * dynamic import *inside an effect*: a page with no diagram never pays for it,
 * and the module never reaches the server bundle (it needs a DOM).
 *
 * The source is read back off the DOM rather than passed as a prop, for the
 * same reason the copy button does it — the highlighted markup is already in
 * the payload, and shipping a second plain-text copy of every diagram would
 * pay twice for the same bytes.
 */
export function DocsMermaid({ children }: { children: ReactNode }) {
	const { resolvedTheme } = useTheme();
	const sourceRef = useRef<HTMLPreElement>(null);
	const [svg, setSvg] = useState<string>();
	const [failed, setFailed] = useState(false);
	const theme = resolvedTheme === "dark" ? "dark" : "light";

	useEffect(() => {
		const source = sourceRef.current?.textContent?.trim();
		if (!source) return;

		let cancelled = false;

		const render = async () => {
			try {
				const { default: mermaid } = await import("mermaid");

				mermaid.initialize({
					startOnLoad: false,
					theme: theme === "dark" ? "dark" : "default",
					securityLevel: "strict",
					fontFamily: "inherit",
				});

				const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
				const result = await mermaid.render(id, source);

				if (!cancelled) setSvg(result.svg);
			} catch {
				/** A broken diagram falls back to its source, never to a blank page. */
				if (!cancelled) setFailed(true);
			}
		};

		void render();

		return () => {
			cancelled = true;
		};
	}, [theme]);

	return (
		<figure className="my-6 overflow-x-auto rounded-xl border border-border/60 bg-muted/20 p-6">
			<pre
				ref={sourceRef}
				className={
					svg && !failed
						? "sr-only"
						: "overflow-x-auto font-mono text-[13px] leading-relaxed"
				}
			>
				{children}
			</pre>

			{svg ? (
				<div
					className="docs-mermaid flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG produced by Mermaid from build-time content, sanitized by securityLevel "strict".
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			) : null}
		</figure>
	);
}
