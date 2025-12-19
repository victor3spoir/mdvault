'use server'

import octokit, { githubRepoInfo } from '@/lib/octokit'
import type {
  CreatePostInput,
  GitHubFile,
  Post,
  PostFrontmatter,
  UpdatePostInput,
} from '../types'

const POSTS_PATH = 'contents/posts'
const IMAGES_PATH = 'contents/images'

function parseFrontmatter(content: string): {
  frontmatter: PostFrontmatter
  body: string
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return {
      frontmatter: { title: 'Untitled', published: false },
      body: content,
    }
  }

  const frontmatterStr = match[1]
  const body = content.slice(match[0].length)

  const frontmatter: PostFrontmatter = { title: 'Untitled', published: false }

  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    switch (key) {
      case 'title':
        frontmatter.title = value
        break
      case 'description':
        frontmatter.description = value
        break
      case 'published':
        frontmatter.published = value === 'true'
        break
      case 'author':
        frontmatter.author = value
        break
      case 'coverImage':
        frontmatter.coverImage = value
        break
      case 'createdAt':
        frontmatter.createdAt = value
        break
      case 'updatedAt':
        frontmatter.updatedAt = value
        break
      case 'tags':
        // Parse array syntax: [tag1, tag2]
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter.tags = value
            .slice(1, -1)
            .split(',')
            .map((t) => t.trim().replace(/['"]/g, ''))
            .filter(Boolean)
        }
        break
    }
  }

  return { frontmatter, body }
}

function generateFrontmatter(data: PostFrontmatter): string {
  const lines = ['---']

  lines.push(`title: "${data.title}"`)
  if (data.description) lines.push(`description: "${data.description}"`)
  lines.push(`published: ${data.published}`)
  if (data.author) lines.push(`author: "${data.author}"`)
  if (data.coverImage) lines.push(`coverImage: "${data.coverImage}"`)
  if (data.createdAt) lines.push(`createdAt: "${data.createdAt}"`)
  if (data.updatedAt) lines.push(`updatedAt: "${data.updatedAt}"`)
  if (data.tags?.length) {
    lines.push(`tags: [${data.tags.map((t) => `"${t}"`).join(', ')}]`)
  }

  lines.push('---')
  return lines.join('\n')
}

export async function listPostsAction(): Promise<Post[]> {
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path: POSTS_PATH,
    })

    if (!Array.isArray(response.data)) {
      return []
    }

    const files = response.data as GitHubFile[]
    const mdFiles = files.filter((f) => f.name.endsWith('.md') || f.name.endsWith('.mdx'))

    const posts: Post[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await getPostContentAction(file.path)
        const { frontmatter, body } = parseFrontmatter(content)
        const slug = file.name.replace(/\.mdx?$/, '')

        return {
          slug,
          title: frontmatter.title,
          description: frontmatter.description,
          content: body,
          createdAt: frontmatter.createdAt || new Date().toISOString(),
          updatedAt: frontmatter.updatedAt || new Date().toISOString(),
          published: frontmatter.published,
          author: frontmatter.author,
          tags: frontmatter.tags,
          coverImage: frontmatter.coverImage,
          sha: file.sha,
        }
      })
    )

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error('Error listing posts:', error)
    return []
  }
}

export async function getPostContentAction(path: string): Promise<string> {
  try {
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
    })

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      throw new Error('Not a file')
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
    return content
  } catch (error) {
    console.error('Error getting post content:', error)
    throw error
  }
}

export async function getPostAction(slug: string): Promise<Post | null> {
  try {
    const path = `${POSTS_PATH}/${slug}.md`
    const response = await octokit.repos.getContent({
      owner: githubRepoInfo.owner,
      repo: githubRepoInfo.repo,
      path,
    })

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      return null
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
    const { frontmatter, body } = parseFrontmatter(content)

    return {
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      content: body,
      createdAt: frontmatter.createdAt || new Date().toISOString(),
      updatedAt: frontmatter.updatedAt || new Date().toISOString(),
      published: frontmatter.published,
      author: frontmatter.author,
      tags: frontmatter.tags,
      coverImage: frontmatter.coverImage,
      sha: response.data.sha,
    }
  } catch (error) {
    console.error('Error getting post:', error)
    return null
  }
}

export async function createPostAction(input: CreatePostInput): Promise<Post> {
  const now = new Date().toISOString()
  
  // Strip any existing frontmatter from the editor content
  const { body: cleanContent } = parseFrontmatter(input.content)
  
  const frontmatter = generateFrontmatter({
    title: input.title,
    description: input.description,
    published: input.published ?? false,
    tags: input.tags,
    coverImage: input.coverImage,
    createdAt: now,
    updatedAt: now,
  })

  const fileContent = `${frontmatter}\n\n${cleanContent}`
  const path = `${POSTS_PATH}/${input.slug}.md`

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Create post: ${input.title}`,
    content: Buffer.from(fileContent).toString('base64'),
  })

  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    content: cleanContent,
    createdAt: now,
    updatedAt: now,
    published: input.published ?? false,
    tags: input.tags,
    coverImage: input.coverImage,
    sha: response.data.content?.sha,
  }
}

export async function updatePostAction(slug: string, input: UpdatePostInput): Promise<Post> {
  const existingPost = await getPostAction(slug)
  if (!existingPost) {
    throw new Error('Post not found')
  }

  const now = new Date().toISOString()
  
  // Strip any existing frontmatter from the editor content
  const rawContent = input.content ?? existingPost.content
  const { body: cleanContent } = parseFrontmatter(rawContent)
  
  const frontmatter = generateFrontmatter({
    title: input.title ?? existingPost.title,
    description: input.description ?? existingPost.description,
    published: input.published ?? existingPost.published,
    tags: input.tags ?? existingPost.tags,
    coverImage: input.coverImage ?? existingPost.coverImage,
    createdAt: existingPost.createdAt,
    updatedAt: now,
  })

  const fileContent = `${frontmatter}\n\n${cleanContent}`
  const path = `${POSTS_PATH}/${slug}.md`

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Update post: ${input.title ?? existingPost.title}`,
    content: Buffer.from(fileContent).toString('base64'),
    sha: input.sha,
  })

  return {
    ...existingPost,
    title: input.title ?? existingPost.title,
    description: input.description ?? existingPost.description,
    content: cleanContent,
    updatedAt: now,
    published: input.published ?? existingPost.published,
    tags: input.tags ?? existingPost.tags,
    coverImage: input.coverImage ?? existingPost.coverImage,
    sha: response.data.content?.sha,
  }
}

export async function deletePostAction(slug: string, sha: string): Promise<void> {
  const path = `${POSTS_PATH}/${slug}.md`

  await octokit.repos.deleteFile({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Delete post: ${slug}`,
    sha,
  })
}

export async function uploadImageAction(file: File, fileName: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const content = Buffer.from(arrayBuffer).toString('base64')
  const path = `${IMAGES_PATH}/${fileName}`

  await octokit.repos.createOrUpdateFileContents({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path,
    message: `Upload image: ${fileName}`,
    content,
  })

  // Return raw GitHub content URL
  return `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${path}`
}
