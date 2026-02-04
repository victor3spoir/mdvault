export interface PostFrontmatter {
  title: string;
  content: string;
  published: boolean;
  author?: string;
  link?: string;
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

export interface Post {
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  published: boolean;
  author?: string;
  link?: string;
  coverImage?: string;
  sha?: string;
}

export type CreatePostInput = Pick<
  Post,
  "title" | "content" | "published" | "coverImage" | "link" | "author"
>;

export interface UpdatePostInput extends Partial<CreatePostInput> {
  sha: string;
}
