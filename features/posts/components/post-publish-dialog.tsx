"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  publishPostAction,
  unpublishPostAction,
} from "@/features/posts/posts.actions";
import type { Post } from "@/features/posts/posts.types";

interface PostPublishDialogProps {
  children: React.ReactNode;
  post: Post;
}

export function PostPublishDialog({ children, post }: PostPublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    setIsLoading(true);
    const result = post.published
      ? await unpublishPostAction(post.id, post.sha!, post.createdAt)
      : await publishPostAction(post.id, post.sha!, post.createdAt);
    setIsLoading(false);

    if (result.success) {
      toast.success(
        post.published ? "Post unpublished" : "Post published successfully",
      );
      setIsOpen(false);
    } else {
      toast.error(result.error || "Failed to update post status");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <AlertDialogContent>
        <AlertDialogTitle>
          {post.published ? "Unpublish Post" : "Publish Post"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {post.published
            ? "This post will no longer be visible to readers."
            : "This post will be published and visible to readers."}
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublish} disabled={isLoading}>
            {isLoading
              ? "Loading..."
              : post.published
                ? "Unpublish"
                : "Publish"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
