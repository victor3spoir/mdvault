import { QueryClient } from "@tanstack/react-query";

/**
 * One QueryClient per request on the server, one for the whole site in the
 * browser (`getRouter()` is called once per document there).
 *
 * Documentation content can only change with a new deploy, so nothing here
 * ever needs to be refetched during a session.
 */
export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: Number.POSITIVE_INFINITY,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});
}
