
export interface ArticleFrontmatter {
  title: string;
  description?: string;
  published: boolean;
  // new add
  // lang: string
  author?: string;
  tags?: string[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedDate?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url: string | null;
}

export interface Article {
  slug: string;
  title: string;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  published: boolean;
  author?: string;
  tags?: string[];
  coverImage?: string;
  sha?: string;
}


export type CreateArticleInput = Pick<Article, "slug" | "title" | "content"
  | "description" | "published" | "tags" | "coverImage">

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  sha: string;
} 
