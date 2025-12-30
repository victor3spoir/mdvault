import type { PostFrontmatter } from "./posts.types";

export function generateFrontmatter(data: PostFrontmatter): string {
  const lines = ["---"];

  lines.push(`title: "${data.title}"`);
  if (data.description) lines.push(`description: "${data.description}"`);
  lines.push(`published: ${data.published}`);
  if (data.author) lines.push(`author: "${data.author}"`);
  if (data.coverImage) lines.push(`coverImage: "${data.coverImage}"`);
  if (data.createdAt) lines.push(`createdAt: "${data.createdAt}"`);
  if (data.updatedAt) lines.push(`updatedAt: "${data.updatedAt}"`);
  if (data.publishedDate) lines.push(`publishedDate: "${data.publishedDate}"`);
  if (data.tags?.length) {
    lines.push(`tags: [${data.tags.map((t) => `"${t}"`).join(", ")}]`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function parseFrontmatter(content: string): {
  frontmatter: PostFrontmatter;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: { title: "Untitled", published: false },
      body: content,
    };
  }

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length);

  const frontmatter: PostFrontmatter = { title: "Untitled", published: false };

  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    switch (key) {
      case "title":
        frontmatter.title = value;
        break;
      case "description":
        frontmatter.description = value;
        break;
      case "published":
        frontmatter.published = value === "true";
        break;
      case "author":
        frontmatter.author = value;
        break;
      case "coverImage":
        frontmatter.coverImage = value;
        break;
      case "createdAt":
        frontmatter.createdAt = value;
        break;
      case "updatedAt":
        frontmatter.updatedAt = value;
        break;
      case "publishedDate":
        frontmatter.publishedDate = value;
        break;
      case "tags":
        // Parse array syntax: [tag1, tag2]
        if (value.startsWith("[") && value.endsWith("]")) {
          frontmatter.tags = value
            .slice(1, -1)
            .split(",")
            .map((t) => t.trim().replace(/['"]/g, ""))
            .filter(Boolean);
        }
        break;
    }
  }

  return { frontmatter, body };
}
