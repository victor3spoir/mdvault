import {
	ContentConflictError,
	ContentNotFoundError,
	InvalidContentError,
} from "#/features/shared/content-revision";
import { FrontmatterError } from "#/lib/frontmatter";
import { createSafeErrorMessage } from "#/lib/server/logger";

function getErrorStatus(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		typeof error.status === "number"
	) {
		return error.status;
	}

	return undefined;
}

export function isGitHubNotFoundError(error: unknown) {
	return getErrorStatus(error) === 404;
}

export function createContentErrorMessage(error: unknown, label: string) {
	if (error instanceof FrontmatterError) {
		return `Invalid ${label.toLowerCase()} metadata: ${error.message}`;
	}

	if (
		error instanceof ContentConflictError ||
		error instanceof ContentNotFoundError ||
		error instanceof InvalidContentError
	) {
		return error.message;
	}

	const status = getErrorStatus(error);
	if (status === 404) {
		return `${label} not found`;
	}
	if (status === 409 || status === 422) {
		return `${label} changed in GitHub. Reload it before saving again.`;
	}
	if (status === 401 || status === 403) {
		return "GitHub denied access to the configured repository.";
	}
	if (status === 429) {
		return "GitHub rate limit reached. Please try again later.";
	}
	if (status !== undefined && status >= 500) {
		return "GitHub is temporarily unavailable. Please try again later.";
	}

	return createSafeErrorMessage(error);
}
