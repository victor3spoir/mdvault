"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { checkMediaUsageAction, deleteImageAction } from "../medias.actions";
import type { MediaFile, MediaUsage } from "../medias.types";

interface DeleteConfirmationDialogProps {
  children: ReactNode;
  image: MediaFile | null;
}

export function MediaDeleteDialog({
  children,
  image,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingUsage, setIsLoadingUsage] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !image?.url) {
      setUsage(null);
      return;
    }

    setIsLoadingUsage(true);

    const checkUsage = async () => {
      try {
        console.log("Checking media usage for:", image.url);
        const result = await checkMediaUsageAction(image.url);
        console.log("Usage check result:", result);
        if (result.success) {
          setUsage(result.data);
        } else {
          toast.error("Failed to check media usage", {
            description: result.error,
          });
        }
      } catch (error) {
        toast.error("Failed to check media usage", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      } finally {
        setIsLoadingUsage(false);
      }
    };

    checkUsage();
  }, [open, image?.url]);

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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {isLoadingUsage ? (
              <div className="flex items-center gap-2 mt-3">
                <IconLoader2 className="size-4 animate-spin" />
                <p className="text-sm">Checking media usage...</p>
              </div>
            ) : usage?.isUsed ? (
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

// const handleDeleteClick = async (image: MediaFile) => {
//   startTransition(async () => {
//     try {
//       const result = await checkMediaUsageAction(image.url);
//       if (result.success) {
//         setDeleteConfirmation({ image, usage: result.data });
//       } else {
//         toast.error("Failed to check image usage", {
//           description: result.error,
//         });
//       }
//     } catch (error) {
//       toast.error("Failed to check image usage", {
//         description:
//           error instanceof Error ? error.message : "Try again later",
//       });
//     }
//   });
// };
