"use client";
import { IconEyeOff, IconLoader2 } from "@tabler/icons-react";
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
import { unpublishArticleAction } from "../articles.actions";

interface ArticleUnpublishDialogProps {
  articleSlug: string;
  articleSha?: string;
}

export function ArticleUnpublishDialog({
  articleSlug,
  articleSha,
}: ArticleUnpublishDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUnpublish = () => {
    if (!articleSha) return;

    startTransition(async () => {
      try {
        await unpublishArticleAction(articleSlug, articleSha);
        toast.success("Article unpublished", {
          description: "Moved back to drafts",
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to unpublish article";
        toast.error(message);
        console.error("Error unpublishing article:", error);
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
          className="flex items-center gap-2 text-amber-600"
        >
          <IconEyeOff className="size-4" />
          Unpublish
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Unpublish this article?</AlertDialogTitle>
          <AlertDialogDescription>
            This will move the article back to drafts. It will no longer be
            visible on the public site.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnpublish}
            disabled={isPending}
            className="rounded-lg"
          >
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Unpublish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ArticleUnpublishDialog;
