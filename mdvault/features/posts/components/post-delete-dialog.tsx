"use client";

import { IconAlertCircle } from "@tabler/icons-react";
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
import { deletePostAction } from "@/features/posts/posts.actions";

interface PostDeleteDialogProps {
  children: React.ReactNode;
  postId: string;
  postSha: string;
}

export default function PostDeleteDialog({
  children,
  postId,
  postSha,
}: PostDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deletePostAction(postId, postSha);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Post deleted successfully");
      setIsOpen(false);
    } else {
      toast.error(result.error || "Failed to delete post");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <>{children}</>}
      <AlertDialogContent>
        <AlertDialogTitle className="flex items-center gap-2">
          <IconAlertCircle className="size-5 text-destructive" />
          Delete Post
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this post? This action cannot be
          undone.
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
