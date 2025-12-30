"use client";

import { IconCalendar, IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Post } from "@/features/posts/posts.types";
import { updatePostMetadataAction } from "@/features/posts/posts.actions";

interface PostMetadataEditorProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (post: Post) => void;
}

export function PostMetadataEditor({
  post,
  isOpen,
  onClose,
  onUpdate,
}: PostMetadataEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [createdAt, setCreatedAt] = useState(post.createdAt);
  const [publishedDate, setPublishedDate] = useState(post.publishedDate || "");

  const handleSave = () => {
    startTransition(async () => {
      try {
        const updatedPost = await updatePostMetadataAction(post.slug, {
          createdAt,
          publishedDate: publishedDate || undefined,
        });
        toast.success("Metadata updated", {
          description: `"${post.title}" metadata has been updated`,
        });
        onUpdate?.(updatedPost);
        onClose();
      } catch (error) {
        toast.error("Failed to update metadata", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Post Metadata</AlertDialogTitle>
          <AlertDialogDescription>
            Update the creation and publication dates for this post.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="created-at" className="flex items-center gap-2">
              <IconCalendar className="size-4" />
              Created Date
            </Label>
            <Input
              id="created-at"
              type="datetime-local"
              value={createdAt.slice(0, 16)}
              onChange={(e) => {
                if (e.target.value) {
                  setCreatedAt(new Date(e.target.value).toISOString());
                }
              }}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="published-date" className="flex items-center gap-2">
              <IconCalendar className="size-4" />
              Published Date {post.published ? "(Optional)" : "(Publish post first)"}
            </Label>
            <Input
              id="published-date"
              type="datetime-local"
              value={publishedDate ? publishedDate.slice(0, 16) : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setPublishedDate(new Date(e.target.value).toISOString());
                } else {
                  setPublishedDate("");
                }
              }}
              disabled={isPending || !post.published}
              placeholder={post.published ? "Set when the post was published" : "Publish the post first"}
            />
            {publishedDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(publishedDate).toLocaleString()}
              </p>
            )}
            {!post.published && (
              <p className="text-xs text-amber-600">
                This field is only available for published posts.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={isPending}>
            <IconX className="mr-2 size-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconCheck className="mr-2 size-4" />
            )}
            {isPending ? "Saving..." : "Save"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
