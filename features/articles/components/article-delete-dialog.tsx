"use client";
import { IconLoader2, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteArticleAction } from "../articles.actions";

interface ArticleDeleteDialogProps {
  articleSlug: string;
  articleSha?: string;
}

const ArticleDeleteDialog = ({
  articleSlug,
  articleSha,
}: ArticleDeleteDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!articleSha) return;

    startTransition(async () => {
      try {
        await deleteArticleAction(articleSlug, articleSha);
        toast.success("Article deleted");
        router.push("/cms/articles");
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
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <IconTrash className="size-4" />
          Delete Article
        </DropdownMenuItem>
      </AlertDialogTrigger>
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
