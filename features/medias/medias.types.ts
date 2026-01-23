export interface MediaFile  {
  id: string;
  name: string;
  path: string;
  url: string;
  uploadedAt: string;
  sha?: string;
}

export interface MediaUsage {
  isUsed: boolean;
  usedInArticles: Array<{
    id: string;
    title: string;
  }>;
}

