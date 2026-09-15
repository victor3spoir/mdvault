import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createQueryClient } from "./integrations/query";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
	queryClient: ReturnType<typeof createQueryClient>;
};

export function getRouter() {
	const queryClient = createQueryClient();

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
