import { createLoader, parseAsString } from "nuqs/server";

export interface MediaFile {
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


// search
// filter

export const mediaFilteringParams = {
  search: parseAsString.withDefault(""),
  filter: parseAsString.withDefault("all")
}
export const loadMediaFilteringParams = createLoader(mediaFilteringParams)