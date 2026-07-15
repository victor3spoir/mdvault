import {
	IconArrowRight,
	IconBrandGithub,
	IconMarkdown,
	IconRocket,
	IconSparkles,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingBackground } from "#/components/landing-background";
import { Logo } from "#/components/logo";
import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const features = [
		{ icon: IconMarkdown, text: "MDX Editor" },
		{ icon: IconBrandGithub, text: "Git Versioning" },
		{ icon: IconRocket, text: "Fast Deploy" },
	];

	return (
		<main className="relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 text-center">
			<div className="absolute top-4 right-4 z-20">
				<ThemeToggle />
			</div>
			<div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
			<LandingBackground />
			<div className="absolute top-0 left-1/2 z-10 h-100 w-150 -translate-x-1/2 bg-primary/15 opacity-60 blur-[120px]" />
			<div className="absolute right-0 bottom-20 z-10 h-80 w-80 bg-accent/10 opacity-40 blur-[100px]" />
			<div className="absolute top-1/3 left-0 z-10 h-60 w-60 bg-primary/5 opacity-30 blur-[90px]" />

			<div className="container relative z-20 mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-4">
				<div className="animate-in slide-in-from-top-8 fade-in shrink-0 duration-1000">
					<Logo className="scale-100 sm:scale-125" />
				</div>

				<div className="animate-in slide-in-from-top-4 fade-in inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm duration-1000 delay-150">
					<IconSparkles className="h-3 w-3 sm:h-4 sm:w-4" />
					<span className="whitespace-nowrap">Modern CMS for GitHub</span>
				</div>

				<div className="animate-in slide-in-from-bottom-4 fade-in flex max-w-3xl flex-col gap-3 duration-1000 delay-200">
					<h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
						Your Markdown, <br />
						<span className="bg-linear-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
							Perfectly Vaulted
						</span>
					</h1>
					<p className="mx-auto max-w-2xl text-sm leading-snug text-muted-foreground sm:text-base">
						A GitHub-backed CMS for articles, posts, and media with a modern
						editor workflow and repository-native storage.
					</p>
				</div>

				<div className="animate-in slide-in-from-bottom-4 fade-in flex w-full flex-col items-center gap-3 duration-1000 delay-500 sm:w-auto sm:flex-row">
					<Button
						size="sm"
						className="h-10 gap-2 px-6 text-sm font-semibold"
						asChild
					>
						<Link to="/cms">
							<span>Get Started</span>
							<IconRocket className="h-4 w-4" />
						</Link>
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="h-10 gap-2 px-6 text-sm font-semibold"
						asChild
					>
						<a
							href="https://github.com/victor3spoir/mdvault"
							target="_blank"
							rel="noreferrer"
						>
							<IconBrandGithub className="h-4 w-4" />
							<span>Explore Source</span>
							<IconArrowRight className="h-3 w-3" />
						</a>
					</Button>
				</div>

				<ul className="animate-in fade-in mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 duration-1000 delay-700 sm:grid-cols-3 sm:gap-0">
					{features.map((feature) => (
						<li
							key={feature.text}
							className="group flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 transition-colors duration-300 hover:bg-muted/30 sm:rounded-none sm:border-l sm:border-border/60 sm:py-1 sm:first:border-l-0"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-primary ring-1 ring-border/30">
								<feature.icon className="size-5" aria-hidden="true" />
							</div>
							<h3 className="text-sm font-semibold text-foreground">
								{feature.text}
							</h3>
						</li>
					))}
				</ul>
			</div>
		</main>
	);
}
