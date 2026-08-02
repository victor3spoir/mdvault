import { z } from "zod";
import {
	getRepositoryFilePath,
	normalizeRepositoryPath,
} from "#/lib/repository-path";

export const ContentRevisionSchema = z.object({
	path: z.string().trim().min(1).max(1024),
	sha: z
		.string()
		.trim()
		.regex(/^[a-f0-9]{40}$/i, "Invalid GitHub file revision"),
});

export type ContentRevision = z.infer<typeof ContentRevisionSchema>;

export interface ContentMutationResult extends ContentRevision {
	id: string;
}

export class ContentConflictError extends Error {
	constructor(label: string) {
		super(`${label} changed in GitHub. Reload it before saving again.`);
		this.name = "ContentConflictError";
	}
}

export class ContentNotFoundError extends Error {
	constructor(label: string) {
		super(`${label} not found`);
		this.name = "ContentNotFoundError";
	}
}

export class InvalidContentError extends Error {
	constructor(label: string, details: string) {
		super(`Invalid ${label.toLowerCase()} content: ${details}`);
		this.name = "InvalidContentError";
	}
}

export function getContentPathCandidates(root: string, id: string) {
	return [
		getRepositoryFilePath(root, id, ".md"),
		getRepositoryFilePath(root, id, ".mdx"),
	].filter((path): path is string => path !== null);
}

export function resolveContentPath(root: string, id: string, path: string) {
	const normalized = normalizeRepositoryPath(path, root);
	if (!normalized) {
		return null;
	}

	const fileName = normalized.split("/").at(-1);
	if (fileName !== `${id}.md` && fileName !== `${id}.mdx`) {
		return null;
	}

	return normalized;
}

export function assertContentRevision(
	expectedSha: string,
	currentSha: string,
	label: string,
) {
	if (expectedSha !== currentSha) {
		throw new ContentConflictError(label);
	}
}
