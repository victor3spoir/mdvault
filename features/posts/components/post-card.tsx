"use client";

import {
  IconCheck,
  IconEdit,
  IconEye,
  IconFileText,
  IconLink,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Post } from "@/features/posts/posts.types";
import { formatDate } from "@/features/shared/shared.utils";
import { PostPublishDialog } from "./post-publish-dialog";
import PostDeleteDialog from "./post-delete-dialog";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = formatDate(new Date(post.createdAt));

  return (
    <TooltipProvider>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:border-primary/20">
        {/* Cover Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/50">
              <IconFileText className="size-10 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Status Badge on Image */}
          <div className="absolute left-3 top-3">
            <Badge
              variant={post.published ? "default" : "secondary"}
              className="h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md"
            >
              {post.published ? (
                <>
                  <IconCheck className="size-3" />
                  Published
                </>
              ) : (
                "Draft"
              )}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 line-clamp-2 text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {post.content}
          </p>

          <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5 shrink-0">
              {formattedDate}
            </span>
            {post.author && (
              <span className="flex items-center gap-1.5 border-l pl-3 truncate">
                By {post.author}
              </span>
            )}
          </div>

          {/* Link preview if exists */}
          {post.link && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-[11px] text-muted-foreground truncate">
              <IconLink className="size-3 shrink-0" />
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary"
              >
                {post.link}
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4 gap-2">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/cms/posts/${post.id}`}>
                      <IconEye className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View post</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/cms/posts/${post.id}/edit`}>
                      <IconEdit className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit post</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PostPublishDialog post={post}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      {post.published ? (
                        <IconX className="size-4 text-amber-600" />
                      ) : (
                        <IconCheck className="size-4 text-emerald-600" />
                      )}
                    </Button>
                  </PostPublishDialog>
                </TooltipTrigger>
                <TooltipContent>
                  {post.published ? "Unpublish" : "Publish"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <PostDeleteDialog postId={post.id} postSha={post.sha!}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </PostDeleteDialog>
                </TooltipTrigger>
                <TooltipContent>Delete post</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="p-5 space-y-4">
        <div className="h-6 w-1/2 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
