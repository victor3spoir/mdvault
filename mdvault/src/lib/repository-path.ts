function decodePath(value: string) {
	try {
		return decodeURIComponent(value).replaceAll("\\", "/").trim();
	} catch {
		return null;
	}
}

function pathSegments(value: string) {
	const decoded = decodePath(value);
	if (!decoded || decoded.startsWith("/") || decoded.includes("\0")) {
		return null;
	}

	const segments = decoded.split("/").filter(Boolean);
	if (segments.some((segment) => segment === "." || segment === "..")) {
		return null;
	}

	return segments;
}

export function normalizeRepositoryPath(path: string, root: string) {
	const pathParts = pathSegments(path);
	const rootParts = pathSegments(root);

	if (!pathParts || !rootParts || pathParts.length < rootParts.length) {
		return null;
	}

	const isUnderRoot = rootParts.every(
		(part, index) => pathParts[index] === part,
	);
	if (!isUnderRoot) {
		return null;
	}

	return pathParts.join("/");
}

export function getRepositoryFilePath(
	root: string,
	identifier: string,
	fileExtension: string,
) {
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(identifier)) {
		return null;
	}

	return normalizeRepositoryPath(`${root}/${identifier}${fileExtension}`, root);
}

export function getRepositoryMediaFilePath(root: string, fileName: string) {
	const normalized = normalizeRepositoryPath(`${root}/${fileName}`, root);
	if (!normalized) {
		return null;
	}

	const rootParts = pathSegments(root);
	const fileParts = pathSegments(normalized);
	if (!rootParts || !fileParts || fileParts.length !== rootParts.length + 1) {
		return null;
	}

	return normalized;
}
