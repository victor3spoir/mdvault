import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	checkMediaUsage,
	deleteImage,
	getMediaDataUrl,
	listImages,
	MAX_IMAGE_BASE64_LENGTH,
	uploadImage,
} from "#/features/media/media.server";
import { normalizeMediaSource } from "#/features/media/media.utils";
import { securityMiddleware } from "#/lib/security-middleware";

export const getImages = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.handler(async () => {
		const result = await listImages();

		if (!result.success) {
			return [];
		}

		return result.data;
	});

export const uploadImageMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data: { fileName: string; mimeType: string; base64: string }) =>
		z
			.object({
				fileName: z.string().trim().min(1).max(255),
				mimeType: z.string().trim().min(1).max(100),
				base64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const result = await uploadImage(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const deleteImageMutation = createServerFn({ method: "POST" })
	.middleware([securityMiddleware])
	.validator((data: { fileName: string; sha: string }) => data)
	.handler(async ({ data }) => {
		const result = await deleteImage(data);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const checkMediaUsageFn = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data: { imageUrl: string }) => data)
	.handler(async ({ data }) => {
		const result = await checkMediaUsage(data.imageUrl);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const getMediaDataUrlFn = createServerFn({ method: "GET" })
	.middleware([securityMiddleware])
	.validator((data: { src: string }) => data)
	.handler(async ({ data }) => {
		const src = normalizeMediaSource(data.src);
		const result = await getMediaDataUrl(src);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.data;
	});
