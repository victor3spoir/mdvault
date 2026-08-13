import type { QueryClient } from "@tanstack/react-query";
import { mediaDataUrlQueryOptions } from "#/features/media/media.queries";

/**
 * Saves a media file to the visitor's machine.
 *
 * Repository media is fetched server-side and delivered as a data URL, so the
 * bytes are already in the browser: the download needs no extra round trip and
 * works the same for private repositories, where a direct link would 404.
 */
export async function downloadMedia(
	queryClient: QueryClient,
	source: string,
	fileName: string,
) {
	// Uses the cached copy when the thumbnail has already loaded, and fetches
	// on demand otherwise.
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
