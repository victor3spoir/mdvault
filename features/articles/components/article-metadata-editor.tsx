"use client";

import { IconCalendar, IconLoader2, IconSettings } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateArticleMetadataAction } from "@/features/articles/articles.actions";
import type { Article } from "@/features/articles/articles.types";

interface PostMetadataEditorProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (article: Article) => void;
}

export function PostMetadataEditor({
  article,
  isOpen,
  onClose,
  onUpdate,
}: PostMetadataEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [createdAt, setCreatedAt] = useState(article.createdAt);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const updatedPost = await updateArticleMetadataAction(article.slug, {
          createdAt,
        });
        toast.success("Metadata updated", {
          description: `"${article.title}" metadata has been updated`,
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
      <AlertDialogContent className="max-w-md rounded-3xl p-8">
        <AlertDialogHeader className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconSettings className="size-6" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold">
            Article Settings
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Update the metadata for &quot;{article.title}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <Label htmlFor="created-at" className="text-sm font-semibold">
              Creation Date
            </Label>
            <div className="relative">
              <IconCalendar className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
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
                className="h-12 rounded-2xl border-muted bg-muted/30 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
            <p className="text-[12px] text-muted-foreground">
              Current: {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel className="h-12 flex-1 rounded-2xl border-muted bg-muted/30 hover:bg-muted/50">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="h-12 flex-1 rounded-2xl shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
