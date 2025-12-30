"use client";

import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconEdit,
  IconEye,
  IconLoader2,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/features/posts/posts.types";
import {
  deletePostAction,
  publishPostAction,
  unpublishPostAction,
} from "../posts.actions";
import { PostMetadataEditor } from "./post-metadata-editor";

interface PostCardProps {
  post: Post;
  onDelete?: (post: Post) => void;
  onPublishChange?: (post: Post) => void;
}

export function PostCard({ post, onDelete, onPublishChange }: PostCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMetadataEditorOpen, setIsMetadataEditorOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const formattedDate = new Date(currentPost.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handlePublish = async () => {
    startTransition(async () => {
      try {
        const updatedPost = await publishPostAction(currentPost.slug, currentPost.sha || "");
        toast.success("Post published", {
          description: `"${currentPost.title}" is now live`,
        });
        setCurrentPost(updatedPost);
        onPublishChange?.(updatedPost);
      } catch (error) {
        toast.error("Failed to publish", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  const handleUnpublish = async () => {
    startTransition(async () => {
      try {
        const updatedPost = await unpublishPostAction(
          currentPost.slug,
          currentPost.sha || "",
        );
        toast.success("Post unpublished", {
          description: `"${currentPost.title}" is now a draft`,
        });
        setCurrentPost(updatedPost);
        onPublishChange?.(updatedPost);
      } catch (error) {
        toast.error("Failed to unpublish", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      toast.error("Delete?", {
        description: "Click again to confirm deletion",
        duration: 3000,
      });
      setTimeout(() => setIsDeleting(false), 3000);
      return;
    }

    startTransition(async () => {
      try {
        await deletePostAction(currentPost.slug, currentPost.sha || "");
        toast.success("Post deleted", {
          description: `"${currentPost.title}" has been removed`,
        });
        onDelete?.(currentPost);
      } catch (error) {
        setIsDeleting(false);
        toast.error("Failed to delete", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
        {/* Cover Image */}
        {currentPost.coverImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            <Image
              src={currentPost.coverImage}
              alt={currentPost.title}
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
            <Badge variant={currentPost.published ? "default" : "secondary"} className="gap-1">
              {currentPost.published ? (
                <>
                  <IconCheck className="size-3" />
                  Published
                </>
              ) : (
                "Draft"
              )}
            </Badge>
            {currentPost.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title & Description */}
          <h3 className="mb-2 text-lg font-semibold leading-tight line-clamp-2">
            {currentPost.title}
          </h3>
          {currentPost.description && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
              {currentPost.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconCalendar className="size-3.5" />
              {formattedDate}
            </span>
            {currentPost.author && (
              <span className="flex items-center gap-1">By {currentPost.author}</span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={`/cms/posts/${currentPost.slug}`} title="View post">
                <IconEye className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link
                href={`/cms/posts/${currentPost.slug}/edit`}
                title="Edit post"
              >
                <IconEdit className="size-4" />
              </Link>
            </Button>
            <Button
              onClick={() => setIsMetadataEditorOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Edit metadata"
            >
              <IconClock className="size-4" />
            </Button>
            {currentPost.published ? (
              <Button
                onClick={handleUnpublish}
                disabled={isPending}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Unpublish post"
              >
                {isPending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconX className="size-4" />
                )}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={isPending}
                size="icon"
                className="h-8 w-8"
                title="Publish post"
              >
                {isPending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconCheck className="size-4" />
                )}
              </Button>
            )}
            <Button
              onClick={handleDelete}
              disabled={isPending}
              variant={isDeleting ? "destructive" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title={isDeleting ? "Click again to confirm" : "Delete post"}
            >
              {isPending ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconTrash className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <PostMetadataEditor
        post={currentPost}
        isOpen={isMetadataEditorOpen}
        onClose={() => setIsMetadataEditorOpen(false)}
        onUpdate={(updatedPost) => setCurrentPost(updatedPost)}
      />
    </>
  );
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
  );
}
