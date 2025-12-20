"use server";

import octokit, { githubRepoInfo } from "@/lib/octokit";
import { validateImageFile } from "@/lib/file-validation";
import { v4 as uuidv4 } from "uuid";
import type { UploadedImage } from "./medias.types";

const IMAGES_PATH = githubRepoInfo.IMAGES_PATH;

export async function listImagesAction(): Promise<UploadedImage[]> {
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: IMAGES_PATH,
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    const files = response.data as Array<{ name: string; path: string; sha: string }>;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const imageFiles = files.filter((f) =>
      imageExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );

    const images: UploadedImage[] = imageFiles.map((file) => ({
      id: file.name.split(".")[0],
      name: file.name,
      path: file.path,
      url: `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${file.path}`,
      uploadedAt: new Date().toISOString(),
      sha: file.sha,
    }));

    return images.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch (error: unknown) {
    // Handle 404 gracefully - directory doesn't exist yet
    if (error instanceof Object && "status" in error && error.status === 404) {
      return [];
    }
    console.error("Error listing images:", error);
    throw new Error("Failed to list images");
  }
}

export async function uploadImageAction(file: File): Promise<UploadedImage> {
  try {
    // Validate file (MIME type, magic bytes, size, format)
    const validatedFile = await validateImageFile(file);

    // Generate UUID with verified extension
    const imageId = uuidv4();
    const fileName = `${imageId}.${validatedFile.format}`;
    const filePath = `${IMAGES_PATH}/${fileName}`;

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

    return {
      id: imageId,
      name: fileName,
      path: filePath,
      url: imageUrl,
      uploadedAt: new Date().toISOString(),
      sha: "",
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error uploading image:", error.message);
      throw error;
    }
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function deleteImageAction(
  _imageId: string,
  fileName: string,
  sha: string,
): Promise<void> {
  const filePath = `${IMAGES_PATH}/${fileName}`;

  try {
    await octokit.repos.deleteFile({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: filePath,
      message: `Delete image: ${fileName}`,
      sha,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error("Failed to delete image");
  }
}
