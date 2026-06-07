import { randomUUID } from "node:crypto";
import { listArticles } from "#/features/articles/articles.server";
import type { MediaFile, MediaUsage } from "#/features/media/media.types";
import { listPosts } from "#/features/posts/posts.server";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubClient } from "#/integrations/github/github-client.server";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { createSafeErrorMessage, logger } from "#/lib/server/logger";

export async function listImages(): Promise<ActionResult<MediaFile[]>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: env.MEDIA_PATH,
		});

		if (!Array.isArray(response.data)) {
			return { success: true, data: [] };
		}

		const imageExtensions = [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".webp",
			".svg",
			".avif",
		];
		const imageFiles = response.data.filter((file) =>
			imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
		);

		return {
			success: true,
			data: imageFiles.map((file) => ({
				id: file.name.split(".")[0],
				name: file.name,
				path: file.path,
				url: file.path,
				uploadedAt: "",
				sha: file.sha,
			})),
		};
	} catch (error) {
		if (error instanceof Object && "status" in error && error.status === 404) {
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

export async function getMediaDataUrl(
	filePath: string,
): Promise<ActionResult<string>> {
	try {
		const env = getGitHubEnv();
		const octokit = getGitHubClient();
		const trimmedPath = filePath.trim();
		const response = await octokit.repos.getContent({
			owner: env.GITHUB_OWNER,
			repo: env.GITHUB_REPO,
			path: trimmedPath,
		});

		if (Array.isArray(response.data) || response.data.type !== "file") {
			return { success: false, error: "Not a file" };
		}

		const ext = trimmedPath.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = MEDIA_MIME_TYPES[ext] ?? "application/octet-stream";
		const base64 = response.data.content.replace(/\n/g, "");
		return { success: true, data: `data:${mimeType};base64,${base64}` };
	} catch (error) {
		logger.error("Failed to fetch media", error, { filePath });
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
