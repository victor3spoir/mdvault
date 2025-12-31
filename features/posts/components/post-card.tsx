"use client";

import {
  IconCalendar,
  IconCheck,
  IconEdit,
  IconEye,
  IconLoader2,
  IconTrash,
  IconX,
  IconSettings,
  IconFileText,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMetadataEditorOpen, setIsMetadataEditorOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const formattedDate = new Date(currentPost.createdAt).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  async function handlePublishToggle(
    published: boolean,
    action: (slug: string, sha: string) => Promise<Post>,
  ) {
    startTransition(async () => {
      try {
        const updatedPost = await action(currentPost.slug, currentPost.sha || "");
        const status = published ? "published" : "unpublished";
        const message = published
          ? `"${currentPost.title}" is now live`
          : `"${currentPost.title}" is now a draft`;
        toast.success(`Post ${status}`, { description: message });
        setCurrentPost(updatedPost);
        onPublishChange?.(updatedPost);
      } catch (error) {
        toast.error(`Failed to ${published ? "publish" : "unpublish"}`, {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  }

  const handlePublish = () =>
    handlePublishToggle(true, publishPostAction);

  const handleUnpublish = () =>
    handlePublishToggle(false, unpublishPostAction);

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deletePostAction(currentPost.slug, currentPost.sha || "");
        toast.success("Post deleted", {
          description: `"${currentPost.title}" has been removed`,
        });
        onDelete?.(currentPost);
      } catch (error) {
        toast.error("Failed to delete", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      } finally {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  return (
    <TooltipProvider>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:border-primary/20">
        {/* Cover Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {currentPost.coverImage ? (
            <Image
              src={currentPost.coverImage}
              alt={currentPost.title}
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
              variant={currentPost.published ? "default" : "secondary"} 
              className="h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md"
            >
              {currentPost.published ? (
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

        <div className="flex flex-1 flex-col p-5">
          {/* Tags */}
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {currentPost.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="h-5 rounded-md px-1.5 text-[10px] font-medium text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-bold leading-tight tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
              {currentPost.title}
            </h3>
            {currentPost.description && (
              <p className="mb-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {currentPost.description}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="mb-4 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <IconCalendar className="size-3.5" />
              {formattedDate}
            </span>
            {currentPost.author && (
              <span className="flex items-center gap-1.5 border-l pl-3">
                By {currentPost.author}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Link href={`/cms/posts/${currentPost.slug}`}>
                      <IconEye className="size-4.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View post</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Link href={`/cms/posts/${currentPost.slug}/edit`}>
                      <IconEdit className="size-4.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit post</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsMetadataEditorOpen(true)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                  >
                    <IconSettings className="size-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  {currentPost.published ? (
                    <Button
                      onClick={handleUnpublish}
                      disabled={isPending}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    >
                      {isPending ? (
                        <IconLoader2 className="size-4.5 animate-spin" />
                      ) : (
                        <IconX className="size-4.5" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePublish}
                      disabled={isPending}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      {isPending ? (
                        <IconLoader2 className="size-4.5 animate-spin" />
                      ) : (
                        <IconCheck className="size-4.5" />
                      )}
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {currentPost.published ? "Unpublish" : "Publish"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isPending}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isPending ? (
                      <IconLoader2 className="size-4.5 animate-spin" />
                    ) : (
                      <IconTrash className="size-4.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete post</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <PostMetadataEditor
        post={currentPost}
        isOpen={isMetadataEditorOpen}
        onClose={() => setIsMetadataEditorOpen(false)}
        onUpdate={(updatedPost) => setCurrentPost(updatedPost)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{currentPost.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

// Loading Skeleton
export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
