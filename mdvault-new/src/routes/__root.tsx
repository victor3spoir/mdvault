import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { AppShell } from "#/components/app-shell";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
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
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return <Outlet />;
}

function NotFoundComponent() {
	return (
		<CenteredMessage>
			<h1 className="text-3xl font-bold">Page not found</h1>
			<p className="text-muted-foreground">
				The page you requested does not exist or was moved.
			</p>
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
