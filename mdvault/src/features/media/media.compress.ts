const SKIP_TYPES = new Set([
	// Re-encoding an animated GIF through a canvas keeps only the first frame.
	"image/gif",
	// AVIF is already better than anything a canvas can produce.
	"image/avif",
	// Vector: there is nothing to re-encode, and it is sanitised server-side.
	"image/svg+xml",
]);

const ENCODABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 2560px stays sharp on HiDPI, where a 1920px cap looks soft. */
const DEFAULT_MAX_DIMENSION = 2560;

/** Best first: the first encode that is meaningfully smaller wins. */
const QUALITY_STEPS = [0.92, 0.86, 0.8] as const;

/** Below this, the quality cost is not worth the bytes saved. */
const MIN_SAVING_RATIO = 0.15;

interface CompressOptions {
	maxDimension?: number;
	minSavingRatio?: number;
}

export interface OptimizeResult {
	file: File;
	optimized: boolean;
	before: number;
	after: number;
}

function canUseImageCompression() {
	return (
		typeof document !== "undefined" &&
		typeof createImageBitmap === "function" &&
		typeof HTMLCanvasElement !== "undefined"
	);
}

export function isOptimizableType(type: string) {
	return ENCODABLE_TYPES.has(type) && !SKIP_TYPES.has(type);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
	return new Promise<Blob | null>((resolve) => {
		canvas.toBlob((result) => resolve(result), type, quality);
	});
}

function renameTo(file: File, blob: Blob, type: string) {
	const extension = type === "image/png" ? "png" : "webp";
	const baseName = file.name.replace(/\.[^.]+$/, "");
	return new File([blob], `${baseName}.${extension}`, { type });
}

/**
 * Re-encodes in the browser. Lossless sources try both PNG and WebP because
 * neither wins consistently.
 */
export async function optimizeImageFile(
	file: File,
	{
		maxDimension = DEFAULT_MAX_DIMENSION,
		minSavingRatio = MIN_SAVING_RATIO,
	}: CompressOptions = {},
): Promise<OptimizeResult> {
	const unchanged: OptimizeResult = {
		file,
		optimized: false,
		before: file.size,
		after: file.size,
	};

	if (!canUseImageCompression() || !isOptimizableType(file.type)) {
		return unchanged;
	}

	try {
		const bitmap = await createImageBitmap(file);
		const { width, height } = bitmap;
		const scale = Math.min(1, maxDimension / Math.max(width, height));

		const canvas = document.createElement("canvas");
		canvas.width = Math.round(width * scale);
		canvas.height = Math.round(height * scale);

		const context = canvas.getContext("2d");
		if (!context) {
			bitmap.close();
			return unchanged;
		}

		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();

		const targets =
			file.type === "image/jpeg"
				? ["image/webp" as const]
				: (["image/webp", "image/png"] as const);

		let best: { blob: Blob; type: string } | null = null;

		for (const type of targets) {
			for (const quality of QUALITY_STEPS) {
				const blob = await toBlob(canvas, type, quality);
				if (!blob) {
					continue;
				}

				if (!best || blob.size < best.blob.size) {
					best = { blob, type };
				}

				if (blob.size <= file.size * (1 - minSavingRatio)) {
					break;
				}

				// PNG encoding ignores quality, so one pass is all there is.
				if (type === "image/png") {
					break;
				}
			}
		}

		if (!best || best.blob.size > file.size * (1 - minSavingRatio)) {
			return unchanged;
		}

		return {
			file: renameTo(file, best.blob, best.type),
			optimized: true,
			before: file.size,
			after: best.blob.size,
		};
	} catch {
		return unchanged;
	}
}

/** Upload path: returns the file to commit, optimized when worthwhile. */
export async function compressImage(
	file: File,
	options: CompressOptions = {},
): Promise<File> {
	const result = await optimizeImageFile(file, options);
	return result.file;
}
