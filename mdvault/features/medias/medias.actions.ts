"use server";

import { validateImageFile } from "@/lib/file-validation";
import octokit, { githubRepoInfo } from "@/lib/octokit";
import { cacheTag, updateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { listArticlesAction } from "../articles/articles.actions";
import type { ActionResult } from "../shared/shared.types";
import type { MediaFile, MediaUsage } from "./medias.types";

const MEDIA_PATH = githubRepoInfo.MEDIA_PATH;

export async function listImagesAction(): Promise<ActionResult<MediaFile[]>> {
	"use cache";
	cacheTag("medias");
	try {
		const response = await octokit.repos.getContent({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path: MEDIA_PATH,
		});

		if (!Array.isArray(response.data)) {
			return { success: true, data: [] };
		}

		const files = response.data as Array<{
			name: string;
			path: string;
			sha: string;
		}>;
		const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
		const imageFiles = files.filter((f) =>
			imageExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
		);

		const images: MediaFile[] = imageFiles.map((file) => ({
			id: file.name.split(".")[0],
			name: file.name,
			path: file.path,
			url: `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${file.path}`,
			uploadedAt: "", // Date not available from getContent API
			sha: file.sha,
		}));

		return {
			success: true,
			data: images.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
		};
	} catch (error: unknown) {
		// Handle 404 gracefully - directory doesn't exist yet
		if (error instanceof Object && "status" in error && error.status === 404) {
			return { success: true, data: [] };
		}
		console.error("Error listing images:", error);
		return { success: false, error: "Failed to list images" };
	}
}

export async function uploadImageAction(
	file: File,
): Promise<ActionResult<MediaFile>> {
	try {
		// Validate file (MIME type, magic bytes, size, format)
		const validatedFile = await validateImageFile(file);

		// Generate UUID with verified extension
		const imageId = uuidv4();
		const fileName = `${imageId}.${validatedFile.format}`;
		const filePath = `${MEDIA_PATH}/${fileName}`;

		// Upload to GitHub
		const base64Content = validatedFile.buffer.toString("base64");
		await octokit.repos.createOrUpdateFileContents({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path: filePath,
			message: `Upload image: ${fileName}`,
			content: base64Content,
		});

		const imageUrl = `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${filePath}`;
		updateTag("medias");
		return {
			success: true,
			data: {
				id: imageId,
				name: fileName,
				path: filePath,
				url: imageUrl,
				uploadedAt: new Date().toISOString(),
				sha: "",
			},
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to upload image";
		console.error("Error uploading image:", message);
		return { success: false, error: message };
	}
}

export async function deleteImageAction(
	_imageId: string,
	fileName: string,
	sha: string,
): Promise<ActionResult<void>> {
	const filePath = `${MEDIA_PATH}/${fileName}`;

	try {
		await octokit.repos.deleteFile({
			owner: githubRepoInfo.owner,
			repo: githubRepoInfo.repo,
			path: filePath,
			message: `Delete image: ${fileName}`,
			sha,
		});
		updateTag("medias");
		return { success: true, data: undefined };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to delete image";
		console.error("Error deleting image:", message);
		return { success: false, error: message };
	}
}

export async function checkMediaUsageAction(
	imageUrl: string,
): Promise<ActionResult<MediaUsage>> {
	try {
		const result = await listArticlesAction();
		const articles = result.success ? result.data : [];

		const usedInArticles = articles
			.filter((article) => {
				const isInCover = article.coverImage === imageUrl;
				const isInContent = article.content.includes(imageUrl);
				return isInCover || isInContent;
			})
			.map((article) => ({
				id: article.id,
				title: article.title,
			}));

		return {
			success: true,
			data: {
				isUsed: usedInArticles.length > 0,
				usedInArticles,
			},
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to check media usage";
		console.error("Error checking media usage:", message);
		return { success: false, error: message };
	}
}
