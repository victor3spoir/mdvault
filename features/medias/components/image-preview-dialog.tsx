"use client";

import {
  IconCheck,
  IconCopy,
  IconX,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { ReactNode, useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { MediaFile } from "../medias.types";

const Image = dynamic(() => import("next/image"), { ssr: false });

interface ImagePreviewDialogProps {
  children: ReactNode
  image: MediaFile | null;
}

export function MediaPreviewDialog({
  children,
  image,
}: ImagePreviewDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const copyUrlToClipboard = useCallback((url: string, imageId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);



  if (!image) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col bg-card">
          {/* Image */}
          <div className="relative bg-muted/50 h-80 flex items-center justify-center">
            <Image
              src={image.url}
              alt={image.name}
              fill
              className="object-contain p-4"
              priority
              sizes="640px"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 size-8 rounded-lg bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
            >
              <IconX className="size-4" />
            </button>
          </div>

          {/* Details */}
          <div className="border-t p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-base line-clamp-2">
                {image.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Uploaded{" "}
                {new Date(image.uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              <div>
                <p className="font-semibold text-muted-foreground uppercase tracking-wide">
                  File Type
                </p>
                <p className="text-sm font-medium mt-1">
                  {image.name.split(".").pop()?.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                URL
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={image.url}
                  readOnly
                  className="flex-1 h-9 px-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground font-mono truncate"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  onClick={() => copyUrlToClipboard(image.url, image.id)}
                >
                  {copiedId === image.id ? (
                    <IconCheck className="size-4 text-emerald-600" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
             
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
