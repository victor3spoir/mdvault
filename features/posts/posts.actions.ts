'use server'

import octokit, { githubRepoInfo } from '@/lib/octokit'
import type {
  CreatePostInput,
  GitHubFile,
  Post,
  UpdatePostInput,
} from './posts.types'
import { generateFrontmatter, parseFrontmatter } from './posts.utils'


const { POSTS_PATH, IMAGES_PATH } = githubRepoInfo

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

  return `https://raw.githubusercontent.com/${githubRepoInfo.owner}/${githubRepoInfo.repo}/main/${path}`
}
