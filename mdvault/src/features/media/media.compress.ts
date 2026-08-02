const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.85;

interface CompressOptions {
	maxDimension?: number;
	quality?: number;
}

function canUseImageCompression() {
	return (
		typeof document !== "undefined" &&
		typeof createImageBitmap === "function" &&
		typeof HTMLCanvasElement !== "undefined"
	);
}

/**
 * Downscales and re-encodes large raster images in the browser before upload,
 * keeping the repository lean. SVG/GIF/AVIF and small images pass through
 * untouched, and any failure falls back to the original file.
 */
export async function compressImage(
	file: File,
	{
		maxDimension = DEFAULT_MAX_DIMENSION,
		quality = DEFAULT_QUALITY,
	}: CompressOptions = {},
): Promise<File> {
	if (!canUseImageCompression() || !COMPRESSIBLE_TYPES.has(file.type)) {
		return file;
	}

	try {
		const bitmap = await createImageBitmap(file);
		const { width, height } = bitmap;
		const scale = Math.min(1, maxDimension / Math.max(width, height));
		const needsResize = scale < 1;

		if (!needsResize && file.size < 512 * 1024) {
			bitmap.close();
			return file;
		}

		const targetWidth = Math.round(width * scale);
		const targetHeight = Math.round(height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const context = canvas.getContext("2d");
		if (!context) {
			bitmap.close();
			return file;
		}

		context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
		bitmap.close();

		const outputType = file.type === "image/png" ? "image/png" : "image/webp";
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((result) => resolve(result), outputType, quality);
		});

		if (!blob || blob.size >= file.size) {
			return file;
		}

		const extension = outputType === "image/png" ? "png" : "webp";
		const baseName = file.name.replace(/\.[^.]+$/, "");
		return new File([blob], `${baseName}.${extension}`, { type: outputType });
	} catch {
		return file;
	}
}
