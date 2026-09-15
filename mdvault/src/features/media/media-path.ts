import { normalizeRepositoryPath } from "#/lib/repository-path";

export const MEDIA_EXTENSION = /\.(?:jpe?g|png|gif|webp|svg|avif)$/i;

export function resolveMediaPath(value: string, root: string) {
	const clean = value.trim().replace(/^\/+/, "");
	const path = normalizeRepositoryPath(
		clean.includes("/") ? clean : `${root}/${clean}`,
		root,
	);
	return path && MEDIA_EXTENSION.test(path) ? path : null;
}

/** Folder input is relative to MEDIA_PATH; an empty value selects the root. */
export function resolveMediaFolder(value: string, root: string) {
	const folder = value.trim();
	if (!folder) return root;
	if (!/^[\p{L}\p{N}_-]+(?:[ /][\p{L}\p{N}_-]+)*$/u.test(folder)) {
		throw new Error(
			"Use folder names with letters, numbers, spaces, hyphens or underscores.",
		);
	}
	const path = normalizeRepositoryPath(`${root}/${folder}`, root);
	if (!path) throw new Error("Invalid media folder");
	return path;
}
