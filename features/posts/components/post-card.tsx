'use client'

import type { Post } from '@/features/posts/posts.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCalendar,
  IconDotsVertical,
} from '@tabler/icons-react'
import Link from 'next/link'
import Image from 'next/image'

interface PostCardProps {
  post: Post
  onDelete?: (post: Post) => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="p-5">
        {/* Status & Tags */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={post.published ? 'default' : 'secondary'}>
            {post.published ? 'Published' : 'Draft'}
          </Badge>
          {post.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title & Description */}
        <h3 className="mb-2 text-lg font-semibold leading-tight line-clamp-2">
          {post.title}
        </h3>
        {post.description && (
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconCalendar className="size-3.5" />
            {formattedDate}
          </span>
          {post.author && (
            <span className="flex items-center gap-1">
              By {post.author}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t pt-4">
          <Button asChild variant="ghost" size="sm" className="flex-1">
            <Link href={`/cms/posts/${post.slug}` as '/'}>
              <IconEye className="mr-1.5 size-4" />
              View
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="flex-1">
            <Link href={`/cms/posts/${post.slug}/edit` as '/'}>
              <IconEdit className="mr-1.5 size-4" />
              Edit
            </Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(post)}
            >
              <IconTrash className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State Component
export function PostsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <IconDotsVertical className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No posts yet</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Get started by creating your first post. You can write in Markdown with
        full support for images, tables, and code blocks.
      </p>
      <Button asChild>
        <Link href="/cms/posts/new">Create First Post</Link>
      </Button>
    </div>
  )
}

// Loading Skeleton
export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 pt-4 border-t">
          <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
