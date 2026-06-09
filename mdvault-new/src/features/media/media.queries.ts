import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { getImages, getMediaDataUrlFn } from "#/features/media/media.functions";
import type { MediaFile } from "#/features/media/media.types";
import {
	collectImageSources,
	isExternalImageSource,
	normalizeMediaSource,
} from "#/features/media/media.utils";

export const mediaListQueryOptions = () =>
	queryOptions({
		queryKey: ["media", "list"],
		queryFn: () => getImages(),
		staleTime: 30_000,
	});

export const mediaDataUrlQueryOptions = (src: string) =>
	queryOptions({
		queryKey: ["media", "data-url", normalizeMediaSource(src)],
		queryFn: async () => {
			const normalized = normalizeMediaSource(src);

			if (!normalized || isExternalImageSource(normalized)) {
				return normalized;
			}

			return getMediaDataUrlFn({
				data: { src: normalized },
			});
		},
		staleTime: Infinity,
		gcTime: Infinity,
	});

export async function prefetchMediaDataUrls(
	queryClient: QueryClient,
	sources: Array<string | undefined | null>,
) {
	const uniqueSources = collectImageSources(sources);

	await Promise.all(
		uniqueSources.map((source) =>
			queryClient.prefetchQuery(mediaDataUrlQueryOptions(source)),
		),
	);
}

export function getMediaSources(media: MediaFile[]) {
	return media.flatMap((file) => [file.url]);
}
