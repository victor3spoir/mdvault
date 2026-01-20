export interface Article {
  slug: string;
  title: string;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  publishedDate?: string; // Date when article was published
  published: boolean;
  author?: string;
  tags?: string[];
  coverImage?: string;
  sha?: string; // GitHub file SHA for updates
}

export interface ArticleFrontmatter {
  title: string;
  description?: string;
  published: boolean;
  author?: string;
  tags?: string[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedDate?: string; // Date when article was published
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url: string | null;
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  content: string;
  description?: string;
  published?: boolean;
  tags?: string[];
  coverImage?: string;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  sha: string;
}
