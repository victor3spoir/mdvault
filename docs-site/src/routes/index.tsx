import {
	IconArrowRight,
	IconBrandGithub,
	IconFileText,
	IconGitBranch,
	IconPhoto,
	IconShieldLock,
} from "@tabler/icons-react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { MarketingHeader } from "#/features/marketing/marketing-header";
import { docsConfig } from "../../content/docs/docs.config";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: docsConfig.marketing.metaTitle },
			{ name: "description", content: docsConfig.description },
		],
	}),
	component: HomePage,
});

const features = [
	{
		icon: IconFileText,
		title: "Write without leaving Markdown",
		description:
			"Create articles, short posts and custom content types with structured frontmatter and a focused editor.",
	},
	{
		icon: IconPhoto,
		title: "Keep media beside the content",
		description:
			"Upload and reuse images from the same repository, without adding a separate media service.",
	},
	{
		icon: IconGitBranch,
		title: "Make every change traceable",
		description:
			"MDVault writes directly to GitHub, so review, rollback and collaboration remain ordinary Git workflows.",
	},
	{
		icon: IconShieldLock,
		title: "Own the full publishing chain",
		description:
			"Your repository stays the database and source of truth. There is no proprietary content format to escape later.",
	},
];

const productViews = [
	{
		src: "/screenshots/editor.png",
		label: "Editor",
		title: "A writing surface that keeps structure close",
		description:
			"Draft rich articles, manage metadata and preview the result without losing the portable Markdown underneath.",
	},
	{
		src: "/screenshots/dashboard.png",
		label: "Workspace",
		title: "See the state of every content space",
		description:
			"Articles, posts and custom vault types stay visible in one workspace, with recent repository activity nearby.",
	},
	{
		src: "/screenshots/media.png",
		label: "Media",
		title: "Manage repository-backed assets",
		description:
			"Search, upload and reuse media while MDVault keeps paths stable for the content that references it.",
	},
];

function HomePage() {
	if (docsConfig.homepage === "docs") {
		return <Navigate to="/docs" replace />;
	}

	if (docsConfig.homepage === "changelog") {
		return <Navigate to="/changelog" replace />;
	}

	return (
		<div className="min-h-svh bg-background text-foreground">
			<MarketingHeader />

			<main>
				<section className="relative isolate overflow-hidden border-b">
					<div className="landing-glow absolute inset-x-0 top-0 -z-10 h-[40rem]" />

					<div className="mx-auto grid w-full max-w-7xl gap-14 px-5 pt-28 pb-20 sm:px-8 sm:pt-36 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-10 lg:pt-40 lg:pb-28">
						<div className="max-w-2xl">
							<p className="mb-6 inline-flex items-center rounded-full border bg-background/80 px-4 py-2 text-sm font-medium tracking-tight text-foreground/80 shadow-sm">
								Content management, powered by GitHub
							</p>

							<h1 className="max-w-xl text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.4rem]">
								Publish from GitHub, without editing files by hand.
							</h1>

							<p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
								MDVault gives writers a clean workspace for Markdown content
								while your repository remains the database, media library and
								version history.
							</p>

							<div className="mt-9 flex flex-wrap items-center gap-3">
								<Button asChild size="lg" className="rounded-full px-6">
									<Link to="/docs">
										Read the docs
										<IconArrowRight className="size-4" />
									</Link>
								</Button>

								<Button
									asChild
									size="lg"
									variant="outline"
									className="rounded-full px-6"
								>
									<a
										href="https://github.com/victor3spoir/mdvault"
										target="_blank"
										rel="noreferrer"
									>
										<IconBrandGithub className="size-4" />
										View source
									</a>
								</Button>
							</div>

							<p className="mt-5 text-sm text-muted-foreground">
								Plain Markdown. Your Git history. No content lock-in.
							</p>
						</div>

						<div className="relative lg:translate-x-10">
							<div className="absolute -inset-12 -z-10 rounded-full bg-brand/10 blur-3xl" />
							<ProductFrame
								src="/screenshots/dashboard.png"
								alt="MDVault dashboard showing content spaces and recent GitHub activity"
								priority
							/>
						</div>
					</div>
				</section>

				<section id="product" className="border-b">
					<div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
						<div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
							<h2 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
								One calm interface for the content already living in Git.
							</h2>
							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								The product follows the repository instead of hiding it. Writers
								get familiar publishing tools; developers keep portable files,
								predictable paths and reviewable commits.
							</p>
						</div>

						<div className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-px overflow-hidden rounded-2xl border bg-border/60">
							{features.map((feature) => (
								<article
									key={feature.title}
									className="flex flex-col gap-4 bg-background p-8 lg:p-10"
								>
									<span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand/10">
										<feature.icon className="size-5 text-brand" />
									</span>
									<h3 className="text-lg font-semibold tracking-tight sm:text-xl">
										{feature.title}
									</h3>
									<p className="leading-7 text-muted-foreground">
										{feature.description}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="bg-muted/35">
					<div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-5 py-20 sm:px-8 sm:py-28">
						{productViews.map((view, index) => (
							<article
								key={view.title}
								className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
							>
								<div
									className={`lg:col-span-4 ${
										index % 2 ? "lg:col-start-9" : ""
									}`}
								>
									<p className="text-sm font-medium text-brand">{view.label}</p>
									<h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.03em]">
										{view.title}
									</h2>
									<p className="mt-4 leading-7 text-muted-foreground">
										{view.description}
									</p>
								</div>

								<div
									className={`lg:col-span-8 ${
										index % 2
											? "lg:col-start-1 lg:row-start-1"
											: "lg:col-start-5"
									}`}
								>
									<ProductFrame
										src={view.src}
										alt={`${view.title} in MDVault`}
									/>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className="border-t bg-foreground text-background">
					<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<p className="text-sm text-background/60">
								Ready to inspect the details?
							</p>
							<h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
								Start with the repository. Keep it yours.
							</h2>
						</div>

						<Button
							asChild
							size="lg"
							variant="secondary"
							className="w-fit rounded-full px-6"
						>
							<Link to="/docs">
								Explore documentation
								<IconArrowRight className="size-4" />
							</Link>
						</Button>
					</div>
				</section>
			</main>

			<footer className="border-t">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
					<p>MDVault. Markdown stays portable.</p>
					<div className="flex items-center gap-5">
						<Link
							to="/docs"
							className="transition-colors hover:text-foreground"
						>
							Documentation
						</Link>
						<Link
							to="/changelog"
							className="transition-colors hover:text-foreground"
						>
							Changelog
						</Link>
						<a
							href="https://github.com/victor3spoir/mdvault"
							target="_blank"
							rel="noreferrer"
							className="transition-colors hover:text-foreground"
						>
							GitHub
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

function ProductFrame({
	src,
	alt,
	priority = false,
}: {
	src: string;
	alt: string;
	priority?: boolean;
}) {
	return (
		<figure className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_-36px_oklch(0.22_0.03_276_/_0.45)]">
			<div className="flex h-9 items-center gap-1.5 border-b bg-muted/70 px-4">
				<span className="size-2 rounded-full bg-foreground/15" />
				<span className="size-2 rounded-full bg-foreground/15" />
				<span className="size-2 rounded-full bg-foreground/15" />
			</div>
			<img
				src={src}
				alt={alt}
				loading={priority ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : "auto"}
				className="block h-auto w-full"
			/>
		</figure>
	);
}
