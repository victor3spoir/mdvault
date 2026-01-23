"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useTransition } from "react";
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
import { deleteImageAction } from "../medias.actions";
import type { MediaUsage, MediaFile  } from "../medias.types";

interface DeleteConfirmationDialogProps {
  image: MediaFile  | null;
  usage: MediaUsage | null;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export function DeleteConfirmationDialog({
  image,
  usage,
  onOpenChange,
  onDeleteSuccess,
}: DeleteConfirmationDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = async () => {
    if (!image) return;

    startTransition(async () => {
      try {
        const result = await deleteImageAction(
          image.id,
          image.name,
          image.sha || "",
        );
        if (result.success) {
          toast.success("Image deleted", {
            description: `"${image.name}" has been removed`,
          });
          onOpenChange(false);
          onDeleteSuccess();
        } else {
          toast.error("Failed to delete image", {
            description: result.error,
          });
        }
      } catch (error) {
        toast.error("Failed to delete image", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  return (
    <AlertDialog open={!!image} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {usage?.isUsed ? (
              <div className="space-y-3 mt-3">
                <p className="text-destructive font-semibold text-sm">
                  ⚠️ In use by {usage.usedInArticles.length} article(s)
                </p>
                <ul className="space-y-2">
                  {usage.usedInArticles.map((article) => (
                    <li
                      key={article.id}
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-destructive/50"
                    >
                      {article.title}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Deleting will break these articles. Continue?
                </p>
              </div>
            ) : (
              <p className="text-sm">
                Permanently delete &quot;{image?.name}&quot;?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-2 justify-end pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <IconLoader2 className="size-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
