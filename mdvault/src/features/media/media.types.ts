export interface MediaFile {
	id: string;
	name: string;
	path: string;
	url: string;
	uploadedAt: string;
	sha: string;
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
