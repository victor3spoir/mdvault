import { randomUUID } from "node:crypto";
import { listArticles } from "#/features/articles/articles.server";
import type { MediaFile, MediaUsage } from "#/features/media/media.types";
import { listPosts } from "#/features/posts/posts.server";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

function base64ToBytes(base64: string) {
	const binary = atob(base64);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

async function getRepositoryTreeEntries() {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
	const repository = await octokit.repos.get({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
	});
	const defaultBranch = repository.data.default_branch ?? "main";
	const ref = await octokit.git.getRef({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		ref: `heads/${defaultBranch}`,
	});
	const tree = await octokit.git.getTree({
		owner: env.GITHUB_OWNER,
		repo: env.GITHUB_REPO,
		tree_sha: ref.data.object.sha,
		recursive: "true",
	});

	return tree.data.tree;
}

async function getRepositoryBlobBytes(fileSha: string) {
	const env = getGitHubEnv();
	const octokit = getGitHubClient();
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
		const env = getGitHubEnv();
		const tree = await getRepositoryTreeEntries();

		const imageExtensions = [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".webp",
			".svg",
			".avif",
		];
		const mediaPrefix = `${env.MEDIA_PATH}/`;
		const imageFiles = tree.filter(
			(item) =>
				item.type === "blob" &&
				typeof item.path === "string" &&
				item.path.startsWith(mediaPrefix) &&
				imageExtensions.some((ext) => item.path.toLowerCase().endsWith(ext)),
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

const MEDIA_MIME_TYPES: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	avif: "image/avif",
};

function getFileExtension(fileName: string, mimeType: string) {
	const fromName = fileName.split(".").pop()?.toLowerCase();
	if (fromName && MEDIA_MIME_TYPES[fromName]) {
		return fromName;
	}

	return Object.entries(MEDIA_MIME_TYPES).find(
		([, value]) => value === mimeType,
	)?.[0];
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

	return normalized;
}

export async function getMediaFile(filePath: string): Promise<
	ActionResult<{
		content: Uint8Array;
		contentType: string;
		etag: string;
	}>
> {
	try {
		const env = getGitHubEnv();
		const trimmedPath = normalizeMediaFilePath(filePath, env.MEDIA_PATH);

		if (!trimmedPath) {
			return { success: false, error: "Missing file path" };
		}

		const ext = trimmedPath.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = MEDIA_MIME_TYPES[ext] ?? "application/octet-stream";
		const octokit = getGitHubClient();
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
				: await getRepositoryBlobBytes(response.data.sha);

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

		const ext = normalizeMediaFilePath(filePath, "")
			.split(".")
			.pop()
			?.toLowerCase();
		const mimeType = ext
			? (MEDIA_MIME_TYPES[ext] ?? fileResult.data.contentType)
			: fileResult.data.contentType;
		const base64 = bytesToBase64(fileResult.data.content);

		return {
			success: true,
			data: `data:${mimeType};base64,${base64}`,
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
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const extension = getFileExtension(input.fileName, input.mimeType);

		if (!extension) {
			return { success: false, error: "Unsupported image format" };
		}

		const fileName = `${randomUUID()}.${extension}`;
		const filePath = `${env.MEDIA_PATH}/${fileName}`;

		await octokit.repos.createOrUpdateFileContents({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: filePath,
			message: `Upload image: ${fileName}`,
			content: input.base64,
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
		const octokit = getGitHubClient();
		await octokit.repos.deleteFile({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: `${env.MEDIA_PATH}/${input.fileName}`,
			message: `Delete image: ${input.fileName}`,
			sha: input.sha,
		});

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
