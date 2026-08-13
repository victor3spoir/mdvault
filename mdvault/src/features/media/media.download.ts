import type { QueryClient } from "@tanstack/react-query";
import { mediaDataUrlQueryOptions } from "#/features/media/media.queries";

/** Downloads from the cached data URL: a direct link 404s on private repos. */
export async function downloadMedia(
	queryClient: QueryClient,
	source: string,
	fileName: string,
) {
	const dataUrl = await queryClient.fetchQuery(
		mediaDataUrlQueryOptions(source),
	);

	if (!dataUrl) {
		throw new Error("This file could not be downloaded");
	}

	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = fileName;
	link.rel = "noopener";

	document.body.append(link);
	link.click();
	link.remove();
}
