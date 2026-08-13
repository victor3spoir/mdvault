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
	type: "article" | "post";
}

export interface MediaUsage {
	isUsed: boolean;
	usedInEntries: MediaUsageReference[];
}
