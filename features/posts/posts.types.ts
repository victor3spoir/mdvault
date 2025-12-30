export interface Post {
  slug: string;
  title: string;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  publishedDate?: string; // Date when post was published
  published: boolean;
  author?: string;
  tags?: string[];
  coverImage?: string;
  sha?: string; // GitHub file SHA for updates
}

export interface PostFrontmatter {
  title: string;
  description?: string;
  published: boolean;
  author?: string;
  tags?: string[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedDate?: string; // Date when post was published
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url: string | null;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  description?: string;
  published?: boolean;
  tags?: string[];
  coverImage?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  sha: string;
}
