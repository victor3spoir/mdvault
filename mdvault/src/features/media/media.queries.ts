import { queryOptions } from "@tanstack/react-query";
import {
	getImages,
	getMediaAudit,
	getMediaDataUrlFn,
} from "#/features/media/media.functions";
import {
	isExternalImageSource,
	normalizeMediaSource,
} from "#/features/media/media.utils";

export const mediaListQueryOptions = () =>
	queryOptions({
		queryKey: ["media", "list"],
		queryFn: () => getImages(),
		staleTime: 30_000,
	});

export const mediaAuditQueryOptions = () =>
	queryOptions({
		queryKey: ["media", "audit"],
		queryFn: () => getMediaAudit(),
		staleTime: 30_000,
		retry: false,
		refetchOnWindowFocus: false,
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
