import type { MarkdownHeading } from "@tanstack/markdown";
import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

/**
 * Right-rail table of contents.
 *
 * The active heading is tracked with an `IntersectionObserver` rather than a
 * scroll listener: the observer fires only when a heading crosses the band, so
 * there is no per-frame work on the main thread while the reader scrolls.
 *
 * The band is the top third of the viewport, which is where the eye sits while
 * reading — highlighting whatever touches the very top of the screen marks the
 * *next* section as active a beat too early.
 */
export function DocsToc({ headings }: { headings: Array<MarkdownHeading> }) {
	const [active, setActive] = useState<string>("");

	useEffect(() => {
		if (!headings.length) return;

		const elements = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((element): element is HTMLElement => element !== null);

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible[0]?.target.id) setActive(visible[0].target.id);
			},
			{ rootMargin: "-10% 0px -70% 0px", threshold: 0 },
		);

		for (const element of elements) observer.observe(element);

		return () => observer.disconnect();
	}, [headings]);

	if (headings.length < 2) return null;

	return (
		<nav aria-label="On this page" className="flex flex-col gap-3">
			<p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground/80 uppercase">
				On this page
			</p>

			<ul className="flex flex-col gap-0.5 border-l border-border/60">
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							className={cn(
								"-ml-px block border-l py-1 text-sm transition-colors",
								heading.level >= 3 ? "pl-6" : "pl-3",
								heading.id === active
									? "border-foreground font-medium text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
