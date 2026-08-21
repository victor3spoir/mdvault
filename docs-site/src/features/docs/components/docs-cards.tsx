import { Link } from "@tanstack/react-router";
import { DocsIcon } from "#/features/docs/components/docs-icon";
import type { DocsNav } from "#/features/docs/docs.types";
import { docsConfig } from "../../../../content/docs/docs.config";

/**
 * Landing grid.
 *
 * Titles and descriptions come from the nav — that is, from the frontmatter of
 * the pages themselves. Retyping them in `docs.config.ts` would let the landing
 * page describe a page differently from the page, which is the single most
 * common way a docs home goes stale.
 *
 * A card whose slug no longer resolves is dropped rather than rendered as a
 * broken link; `bun run docs:check` is what turns that into a loud failure.
 */
export function DocsCards({ nav }: { nav: DocsNav }) {
	const bySlug = new Map(nav.order.map((link) => [link.slug, link]));

	return (
		<div className="flex flex-col gap-12">
			{docsConfig.landing.groups.map((group) => {
				const cards = group.cards.filter((card) => bySlug.has(card.slug));

				if (!cards.length) return null;

				return (
					<section key={group.label} className="flex flex-col gap-4">
						<h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground/80 uppercase">
							{group.label}
						</h2>

						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{cards.map((card) => {
								const link = bySlug.get(card.slug);
								if (!link) return null;

								return (
									<Link
										key={card.slug}
										to="/$"
										params={{ _splat: card.slug }}
										className="group flex flex-col gap-2 rounded-xl border p-5 transition-colors hover:border-foreground/30 hover:bg-accent/40"
									>
										<DocsIcon
											name={card.icon}
											className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
										/>
										<span className="text-sm font-medium">{link.title}</span>
										<span className="text-sm leading-relaxed text-muted-foreground">
											{link.description}
										</span>
									</Link>
								);
							})}
						</div>
					</section>
				);
			})}
		</div>
	);
}
