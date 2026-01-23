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
  publishArticleAction,
  unpublishArticleAction,
} from "../articles.actions";
import type { Article } from "../articles.types";

interface ArticlePublishDialogProps {
  children: ReactNode;
  article: Article;
}

export function ArticlePublishDialog({
  children,
  article,
}: ArticlePublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isPublished = article.published;

  const handleTogglePublish = () => {
    startTransition(async () => {
      try {
        const result = isPublished
          ? await unpublishArticleAction(article.slug, article.sha || "")
          : await publishArticleAction(article.slug, article.sha || "");

        if (!result.success) {
          toast.error(
            isPublished ? "Failed to unpublish" : "Failed to publish",
            {
              description: result.error,
            }
          );
          return;
        }

        const status = isPublished ? "unpublished" : "published";
        const message = isPublished
          ? "Moved back to drafts"
          : "Now live to the public";

        toast.success(`Article ${status}`, {
          description: message,
        });
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isPublished
              ? "Failed to unpublish article"
              : "Failed to publish article";
        toast.error(message);
        console.error(
          isPublished ? "Error unpublishing article:" : "Error publishing article:",
          error
        );
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? "Unpublish this article?" : "Publish this article?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublished
              ? "This will move the article back to drafts. It will no longer be visible on the public site."
              : "This will make the article visible to the public on your site."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            disabled={isPending}
            className="rounded-lg"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTogglePublish}
            disabled={isPending}
            className={`rounded-lg ${
              isPublished
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : isPublished ? (
              <IconEyeOff className="mr-2 size-4" />
            ) : (
              <IconEye className="mr-2 size-4" />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ArticlePublishDialog;
