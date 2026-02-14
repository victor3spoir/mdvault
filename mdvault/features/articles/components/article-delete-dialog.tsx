"use client";
import { IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
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
import { ARTICLE_ROUTES } from "../articles.constants";
import { deleteArticleAction } from "../articles.actions";

interface ArticleDeleteDialogProps {
  children: ReactNode;
  articleId: string;
  articleSha?: string;
}

const ArticleDeleteDialog = ({
  children,
  articleId,
  articleSha,
}: ArticleDeleteDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!articleSha) return;

    startTransition(async () => {
      try {
        await deleteArticleAction(articleId, articleSha);
        toast.success("Article deleted");
        router.push(ARTICLE_ROUTES.LIST);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete article";
        toast.error(message);
        console.error("Error deleting article:", error);
      } finally {
        setOpen(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this article?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The article will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArticleDeleteDialog;
