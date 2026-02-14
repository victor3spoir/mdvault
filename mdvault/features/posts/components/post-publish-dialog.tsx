"use client";

import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  publishPostAction,
  unpublishPostAction,
} from "@/features/posts/posts.actions";
import type { Post } from "@/features/posts/posts.types";

interface PostPublishDialogProps {
  children: ReactNode;
  post: Post;
}

export function PostPublishDialog({ children, post }: PostPublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isPublished = post.published;

  const handleTogglePublish = () => {
    startTransition(async () => {
      try {
        const result = isPublished
          ? await unpublishPostAction(post.id, post.sha || "", post.createdAt)
          : await publishPostAction(post.id, post.sha || "", post.createdAt);

        if (!result.success) {
          toast.error(
            isPublished ? "Failed to unpublish" : "Failed to publish",
            {
              description: result.error,
            },
          );
          return;
        }

        const status = isPublished ? "unpublished" : "published";
        const message = isPublished
          ? "Moved back to drafts"
          : "Now live to the public";

        toast.success(`Post ${status}`, {
          description: message,
        });
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isPublished
              ? "Failed to unpublish post"
              : "Failed to publish post";
        toast.error(message);
        console.error("Error toggling publish:", error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? "Unpublish Post" : "Publish Post"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublished
              ? "This post will no longer be visible to readers."
              : "This post will be published and visible to readers."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTogglePublish}
            disabled={isPending}
          >
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : isPublished ? (
              <IconEyeOff className="mr-2 size-4" />
            ) : (
              <IconEye className="mr-2 size-4" />
            )}
            {isPending
              ? "Loading..."
              : isPublished
                ? "Unpublish"
                : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
