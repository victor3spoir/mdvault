export interface MediaFile {
	id: string;
	name: string;
	path: string;
	url: string;
	uploadedAt: string;
	sha: string;
	/** Bytes, from the repository tree. 0 when unknown. */
	size: number;
}

export interface MediaUsageReference {
	id: string;
	title: string;
	type: "article" | "post" | "vault";
	path: string;
	assetType?: string;
}

export interface MediaUsage {
	isUsed: boolean;
	usedInEntries: MediaUsageReference[];
}

export interface MediaAudit {
	mediaRoot: string;
	commit: string;
	scannedAt: string;
	documentCount: number;
	usage: Record<string, MediaUsage>;
	unusedPaths: string[];
	missing: Array<{ path: string; usedInEntries: MediaUsageReference[] }>;
}

export interface MediaTarget {
	path: string;
	sha: string;
}
