import {
	IconAlertTriangle,
	IconArrowLeft,
	IconError404,
	IconHome,
} from "@tabler/icons-react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "#/components/app-shell";
import { Button } from "#/components/ui/button";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "MDVault",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootComponent,
	errorComponent: RootErrorComponent,
	notFoundComponent: NotFoundComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className="h-full">
			<head>
				<HeadContent />
			</head>
			<body className="h-full antialiased">
				<AppShell>{children}</AppShell>
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return <Outlet />;
}

function NotFoundComponent() {
	const goBack = () => window.history.back();

	return (
		<CenteredMessage>
			<div className="space-y-6">
				<div className="flex justify-center">
					<div className="relative rounded-full border border-primary/10 bg-primary/5 p-6">
						<div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
						<IconError404 className="relative mx-auto size-16 text-primary/70" />
					</div>
				</div>

				<div className="space-y-3">
					<h1 className="text-4xl font-bold">Page Not Found</h1>
					<p className="text-muted-foreground">
						We couldn't find what you're looking for.
					</p>
					<p className="text-sm leading-relaxed text-muted-foreground/80">
						The page may have moved, been removed, or the URL may be wrong.
					</p>
				</div>

				<div className="flex flex-col justify-center gap-3 sm:flex-row">
					<Button asChild size="lg">
						<Link to="/cms">
							<IconHome className="size-4" />
							Go to Dashboard
						</Link>
					</Button>
					<Button variant="outline" size="lg" onClick={goBack}>
						<IconArrowLeft className="size-4" />
						Go Back
					</Button>
				</div>
			</div>
		</CenteredMessage>
	);
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	const handleRetry = async () => {
		reset();
		await router.invalidate();
	};

	return (
		<CenteredMessage>
			<div className="space-y-6">
				<div className="flex justify-center">
					<div className="relative rounded-full border border-destructive/20 bg-destructive/10 p-5">
						<div className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl" />
						<IconAlertTriangle className="relative mx-auto size-12 text-destructive" />
					</div>
				</div>

				<div className="space-y-3">
					<h1 className="text-3xl font-bold">Something Went Wrong</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{error.message ||
							"An unexpected error occurred while loading this page."}
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button onClick={handleRetry} className="flex-1">
						<IconAlertTriangle className="size-4" />
						Try Again
					</Button>
					<Button asChild variant="outline" className="flex-1">
						<Link to="/">
							<IconHome className="size-4" />
							Go Home
						</Link>
					</Button>
				</div>
			</div>
		</CenteredMessage>
	);
}

function CenteredMessage({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="max-w-md space-y-4 text-center">{children}</div>
		</div>
	);
}
