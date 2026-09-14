import { IconArrowRight, IconGitCommit } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { MarketingHeader } from "#/features/marketing/marketing-header";
import { productReleases } from "../../content/changelog";
import { docsConfig } from "../../content/docs/docs.config";

export const Route = createFileRoute("/changelog")({
	head: () => ({
		meta: [
			{
				title: `${docsConfig.changelog.title} · ${docsConfig.siteName}`,
			},
			{
				name: "description",
				content: docsConfig.changelog.description,
			},
		],
	}),
	component: ChangelogPage,
});

function ChangelogPage() {
	return (
		<div className="min-h-svh bg-background text-foreground">
			<MarketingHeader />

			<main>
				<section className="relative isolate overflow-hidden border-b">
					<div className="landing-glow absolute inset-x-0 top-0 -z-10 h-[32rem]" />

					<div className="mx-auto w-full max-w-5xl px-5 pt-32 pb-16 sm:px-8 sm:pt-40 sm:pb-24">
						<p className="flex items-center gap-2 text-sm font-medium text-brand">
							<IconGitCommit className="size-4" />
							Product history
						</p>
						<h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
							{docsConfig.changelog.title}
						</h1>
						<p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
							{docsConfig.changelog.description}
						</p>
					</div>
				</section>

				<section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
					<div className="space-y-20">
						{productReleases.map((release) => (
							<article
								key={release.version}
								className="grid gap-8 border-t pt-8 lg:grid-cols-[12rem_1fr] lg:gap-14"
							>
								<div>
									<h2 className="text-2xl font-semibold tracking-tight">
										v{release.version}
									</h2>
									{release.date ? (
										<time
											dateTime={release.date}
											className="mt-2 block text-sm text-muted-foreground"
										>
											{new Intl.DateTimeFormat("en", {
												year: "numeric",
												month: "long",
												day: "numeric",
												timeZone: "UTC",
											}).format(new Date(`${release.date}T00:00:00Z`))}
										</time>
									) : null}
								</div>

								<div>
									<p className="max-w-2xl text-lg leading-8">
										{release.summary}
									</p>

									<div className="mt-9 grid gap-9 sm:grid-cols-2">
										{release.sections.map((section) => (
											<section key={section.title}>
												<h3 className="text-sm font-semibold">
													{section.title}
												</h3>
												<ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
													{section.items.map((item) => (
														<li key={item} className="flex gap-3">
															<span
																aria-hidden="true"
																className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
															/>
															<span>{item}</span>
														</li>
													))}
												</ul>
											</section>
										))}
									</div>
								</div>
							</article>
						))}
					</div>

					<div className="mt-20 flex flex-col gap-5 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
						<p className="max-w-xl text-sm leading-6 text-muted-foreground">
							Want implementation details, configuration and usage guides?
						</p>
						<Button asChild className="w-fit rounded-full px-5">
							<Link to="/docs">
								Read the documentation
								<IconArrowRight className="size-4" />
							</Link>
						</Button>
					</div>
				</section>
			</main>
		</div>
	);
}
