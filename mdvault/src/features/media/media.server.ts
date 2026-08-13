import { randomUUID } from "node:crypto";
import { listArticles } from "#/features/articles/articles.server";
import type { MediaFile, MediaUsage } from "#/features/media/media.types";
import { isSvgDocument, sanitizeSvg } from "#/features/media/svg-sanitize";
import { listPosts } from "#/features/posts/posts.server";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import {
	getRepositoryMediaFilePath,
	normalizeRepositoryPath,
} from "#/lib/repository-path";
import {
	base64ToBytes,
	bytesToBase64,
	deleteRepositoryFile,
} from "#/lib/server/github-files.server";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

async function getRepositoryTreeEntries(
	octokit: ReturnType<typeof getGitHubClient>,
) {
	const env = getGitHubEnv();
	const tree = await octokit.git.getTree({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		tree_sha: "HEAD",
		recursive: "true",
	});

	return tree.data.tree;
}

async function getRepositoryBlobBytes(
	octokit: ReturnType<typeof getGitHubClient>,
	fileSha: string,
) {
	const env = getGitHubEnv();
	const blob = await octokit.git.getBlob({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		file_sha: fileSha,
	});

	if (blob.data.encoding !== "base64") {
		throw new Error("Unexpected blob encoding");
	}

	return {
		content: base64ToBytes(blob.data.content.replace(/\n/g, "")),
		etag: blob.data.sha,
	};
}

export async function listImages(): Promise<ActionResult<MediaFile[]>> {
	try {
		const octokit = getGitHubClient();
		const env = getGitHubEnv();
		const tree = await getRepositoryTreeEntries(octokit);

		const mediaPrefix = `${env.MEDIA_PATH}/`;
		const imageFiles = tree.filter(
			(item) =>
				item.type === "blob" &&
				typeof item.path === "string" &&
				item.path.startsWith(mediaPrefix) &&
				isSupportedMediaPath(item.path),
		);

		return {
			success: true,
			data: imageFiles.map((file) => {
				const name = file.path.split("/").pop() ?? file.path;

				return {
					id: name.split(".")[0],
					name,
					path: file.path,
					url: file.path,
					uploadedAt: "",
					sha: file.sha ?? "",
					size: file.size ?? 0,
				};
			}),
		};
	} catch (error) {
		if (
			error instanceof Object &&
			"status" in error &&
			Number(error.status) === 404
		) {
			return { success: true, data: [] };
		}

		logger.error("Failed to list images", error);
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

/**
 * The single source of truth for the media this app understands. Anything not
 * listed here is neither listed, served nor accepted.
 */
const MEDIA_MIME_TYPES: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	avif: "image/avif",
};

/**
 * SVG is accepted, but never as-is: it is a document that can carry scripts,
 * event handlers and remote references. Uploads are sanitised before they are
 * committed (see `sanitizeSvg`), so what lands in the repository is inert.
 */
const UPLOADABLE_EXTENSIONS = Object.keys(MEDIA_MIME_TYPES);

function mediaExtension(path: string) {
	return path.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedMediaPath(path: string) {
	return mediaExtension(path) in MEDIA_MIME_TYPES;
}

function decodeUploadBase64(value: string) {
	if (
		!value ||
		value.length > MAX_IMAGE_BASE64_LENGTH ||
		!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
			value,
		)
	) {
		return null;
	}

	const bytes = Buffer.from(value, "base64");
	if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
		return null;
	}

	const canonical = bytes.toString("base64").replace(/=+$/, "");
	if (canonical !== value.replace(/=+$/, "")) {
		return null;
	}

	return bytes;
}

function startsWithBytes(bytes: Uint8Array, signature: number[], offset = 0) {
	return signature.every((byte, index) => bytes[offset + index] === byte);
}

function hasAvifSignature(bytes: Uint8Array) {
	if (!startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
		return false;
	}

	const brands = new TextDecoder().decode(bytes.slice(8, 32));
	return brands.includes("avif") || brands.includes("avis");
}

function hasValidImageSignature(extension: string, bytes: Uint8Array) {
	switch (extension) {
		case "svg":
			// SVG is text, so there is no magic number to check - the payload has
			// to actually look like an SVG document.
			return isSvgDocument(new TextDecoder().decode(bytes.slice(0, 2048)));
		case "jpg":
		case "jpeg":
			return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
		case "png":
			return startsWithBytes(
				bytes,
				[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
			);
		case "gif":
			return (
				startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
				startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
			);
		case "webp":
			return (
				startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
				startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
			);
		case "avif":
			return hasAvifSignature(bytes);
		default:
			return false;
	}
}

/**
 * Validates an upload and returns what should actually be committed.
 *
 * For raster formats that is the original payload. For SVG it is the sanitised
 * document, so a file carrying scripts is stored inert rather than rejected.
 */
function validateUploadImage(
	fileName: string,
	mimeType: string,
	base64: string,
): { extension: string; content: string; removed: string[] } | null {
	const bytes = decodeUploadBase64(base64);
	if (!bytes) {
		return null;
	}

	const extensionFromName = mediaExtension(fileName);
	const extension = UPLOADABLE_EXTENSIONS.includes(extensionFromName)
		? extensionFromName
		: UPLOADABLE_EXTENSIONS.find(
				(candidate) => MEDIA_MIME_TYPES[candidate] === mimeType,
			);

	if (
		!extension ||
		MEDIA_MIME_TYPES[extension] !== mimeType ||
		!hasValidImageSignature(extension, bytes)
	) {
		return null;
	}

	if (extension === "svg") {
		const { svg, removed } = sanitizeSvg(new TextDecoder().decode(bytes));
		return {
			extension,
			content: Buffer.from(svg, "utf8").toString("base64"),
			removed,
		};
	}

	return { extension, content: base64, removed: [] };
}

function normalizeMediaFilePath(filePath: string, mediaPath: string) {
	let normalized = decodeURIComponent(filePath).trim();

	if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
		const url = new URL(normalized);
		if (url.hostname === "github.com") {
			const parts = url.pathname.split("/").filter(Boolean);
			const blobIndex = parts.indexOf("blob");
			if (blobIndex >= 0 && blobIndex + 2 < parts.length) {
				normalized = parts.slice(blobIndex + 2).join("/");
			} else {
				normalized = url.pathname;
			}
		} else if (url.hostname === "raw.githubusercontent.com") {
			const parts = url.pathname.split("/").filter(Boolean);
			if (parts.length > 4) {
				normalized = parts.slice(4).join("/");
			} else {
				normalized = url.pathname;
			}
		} else if (url.pathname === "/api/image") {
			normalized = url.searchParams.get("path")?.trim() ?? "";
		} else if (url.pathname.startsWith("/api/image/")) {
			normalized = url.pathname.slice("/api/image/".length);
		}
	}

	normalized = normalized.replace(/^\/+/, "");

	if (!normalized) {
		return "";
	}

	const mediaPrefix = `${mediaPath}/`;
	if (!normalized.startsWith(mediaPrefix)) {
		const fileName = normalized.split("/").pop();
		normalized = fileName ? `${mediaPrefix}${fileName}` : normalized;
	}

	return normalizeRepositoryPath(normalized, mediaPath);
}

async function getMediaFile(filePath: string): Promise<
	ActionResult<{
		content: Uint8Array;
		contentType: string;
		etag: string;
	}>
> {
	try {
		const octokit = getGitHubClient();
		const env = getGitHubEnv();
		const trimmedPath = normalizeMediaFilePath(filePath, env.MEDIA_PATH);

		if (!trimmedPath) {
			return { success: false, error: "Missing file path" };
		}

		// Only media this app understands is ever served back to the browser.
		if (!isSupportedMediaPath(trimmedPath)) {
			return { success: false, error: "Unsupported media type" };
		}

		const mimeType = MEDIA_MIME_TYPES[mediaExtension(trimmedPath)] as string;
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: trimmedPath,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			return { success: false, error: "Not a file" };
		}

		const fileData =
			response.data.encoding === "base64" && response.data.content.trim()
				? {
						content: base64ToBytes(response.data.content.replace(/\n/g, "")),
						etag: response.data.sha,
					}
				: await getRepositoryBlobBytes(octokit, response.data.sha);

		return {
			success: true,
			data: {
				content: fileData.content,
				contentType: mimeType,
				etag: fileData.etag,
			},
		};
	} catch (error) {
		logger.error("Failed to fetch media file", error, { filePath });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function getMediaDataUrl(
	filePath: string,
): Promise<ActionResult<string>> {
	try {
		const fileResult = await getMediaFile(filePath);

		if (!fileResult.success) {
			return fileResult;
		}

		const normalizedPath = normalizeMediaFilePath(
			filePath,
			getGitHubEnv().MEDIA_PATH,
		);
		if (!normalizedPath) {
			return { success: false, error: "Invalid media file path" };
		}
		const base64 = bytesToBase64(fileResult.data.content);

		return {
			success: true,
			data: `data:${fileResult.data.contentType};base64,${base64}`,
		};
	} catch (error) {
		logger.error("Failed to fetch media data url", error, { filePath });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function uploadImage(input: {
	fileName: string;
	mimeType: string;
	base64: string;
}): Promise<ActionResult<MediaFile>> {
	try {
		const upload = validateUploadImage(
			input.fileName,
			input.mimeType,
			input.base64,
		);

		if (!upload) {
			return { success: false, error: "Invalid or unsupported image upload" };
		}

		if (upload.removed.length > 0) {
			logger.warn("Sanitized SVG upload", {
				fileName: input.fileName,
				removed: upload.removed,
			});
		}

		const env = getGitHubEnv();
		const octokit = getGitHubClient();

		const fileName = `${randomUUID()}.${upload.extension}`;
		const filePath = `${env.MEDIA_PATH}/${fileName}`;

		await octokit.repos.createOrUpdateFileContents({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: filePath,
			message: `Upload image: ${fileName}`,
			content: upload.content,
		});

		return {
			success: true,
			data: {
				id: fileName.split(".")[0],
				name: fileName,
				path: filePath,
				url: filePath,
				uploadedAt: new Date().toISOString(),
				sha: "",
				size: base64ToBytes(upload.content).length,
			},
		};
	} catch (error) {
		logger.error("Failed to upload image", error, { fileName: input.fileName });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function deleteImage(input: {
	fileName: string;
	sha: string;
}): Promise<ActionResult<boolean>> {
	try {
		const env = getGitHubEnv();
		const path = getRepositoryMediaFilePath(env.MEDIA_PATH, input.fileName);
		if (!path) {
			return { success: false, error: "Invalid media file name" };
		}
		await deleteRepositoryFile(
			path,
			`Delete image: ${input.fileName}`,
			input.sha,
		);

		return { success: true, data: true };
	} catch (error) {
		logger.error("Failed to delete image", error, { fileName: input.fileName });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}

export async function checkMediaUsage(
	imageUrl: string,
): Promise<ActionResult<MediaUsage>> {
	try {
		const [articlesResult, postsResult] = await Promise.all([
			listArticles(),
			listPosts(),
		]);

		const usedInEntries = [
			...(articlesResult.success
				? articlesResult.data
						.filter(
							(article) =>
								article.coverImage === imageUrl ||
								article.content.includes(imageUrl),
						)
						.map((article) => ({
							id: article.id,
							title: article.title,
							type: "article" as const,
						}))
				: []),
			...(postsResult.success
				? postsResult.data
						.filter(
							(post) =>
								post.coverImage === imageUrl || post.content.includes(imageUrl),
						)
						.map((post) => ({
							id: post.id,
							title: post.title,
							type: "post" as const,
						}))
				: []),
		];

		return {
			success: true,
			data: {
				isUsed: usedInEntries.length > 0,
				usedInEntries,
			},
		};
	} catch (error) {
		logger.error("Failed to check media usage", error, { imageUrl });
		return { success: false, error: createSafeErrorMessage(error) };
	}
}
