export interface UploadedImage {
  id: string;
  name: string;
  path: string;
  url: string;
  uploadedAt: string;
  sha?: string;
}

export type MediaFile = UploadedImage;

export interface MediaUsage {
  isUsed: boolean;
  usedInPosts: Array<{
    slug: string;
    title: string;
  }>;
}
