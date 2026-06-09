import { createServerFn } from "@tanstack/react-start";
import {
	checkMediaUsage,
	deleteImage,
	getMediaDataUrl,
	listImages,
	uploadImage,
} from "#/features/media/media.server";
import { normalizeMediaSource } from "#/features/media/media.utils";

export const getImages = createServerFn({ method: "GET" }).handler(async () => {
	const result = await listImages();

	if (!result.success) {
		throw new Error(result.error);
	}

	return result.data;
});

export const uploadImageMutation = createServerFn({ method: "POST" })
	.validator(
		(data: { fileName: string; mimeType: string; base64: string }) => data,
	)
	.handler(async ({ data }) => {
		const result = await uploadImage(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deleteImageMutation = createServerFn({ method: "POST" })
	.validator((data: { fileName: string; sha: string }) => data)
	.handler(async ({ data }) => {
		const result = await deleteImage(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const checkMediaUsageFn = createServerFn({ method: "GET" })
	.validator((data: { imageUrl: string }) => data)
	.handler(async ({ data }) => {
		const result = await checkMediaUsage(data.imageUrl);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getMediaDataUrlFn = createServerFn({ method: "GET" })
	.validator((data: { src: string }) => data)
	.handler(async ({ data }) => {
		const src = normalizeMediaSource(data.src);
		const result = await getMediaDataUrl(src);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
