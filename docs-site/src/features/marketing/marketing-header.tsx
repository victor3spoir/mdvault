import { IconBrandGithub } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { ThemeToggle } from "#/integrations/theme";
import { docsConfig } from "../../../content/docs/docs.config";

export function MarketingHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
			<nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-5 sm:px-8">
				<Link to="/" className="flex items-center gap-2.5">
					<img src="/logo.png" alt="" className="size-8 object-contain" />
					<span className="text-sm font-semibold tracking-tight">
						{docsConfig.siteName}
					</span>
				</Link>

				<div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
					<Link
						to="/"
						hash="product"
						className="transition-colors hover:text-foreground"
					>
						Product
					</Link>
					<Link to="/docs" className="transition-colors hover:text-foreground">
						Docs
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
						aria-label="MDVault on GitHub"
						className="transition-colors hover:text-foreground"
					>
						<IconBrandGithub className="size-4" />
					</a>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					<Button asChild size="sm" className="rounded-full px-4">
						<Link to="/docs">Get started</Link>
					</Button>
				</div>
			</nav>
		</header>
	);
}
