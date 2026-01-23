import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MediaUsage, UploadedImage } from "../medias.types";
import { IconEye, IconTrash } from "@tabler/icons-react";
import { ImagePreviewDialog } from "./image-preview-dialog";
import { useState, useTransition } from "react";
import { checkMediaUsageAction } from "../medias.actions";
import dynamic from "next/dynamic";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { toast } from "sonner";

const Image = dynamic(() => import("next/image"), { ssr: false });

const MediaCard = ({ media }: { media: UploadedImage }) => {
  
  const [selectedImageForPreview, setSelectedImageForPreview] =
    useState<UploadedImage | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    image: UploadedImage;
    usage: MediaUsage;
  } | null>(null);

  const handleDeleteClick = async (image: UploadedImage) => {
    startTransition(async () => {
      try {
        const usage = await checkMediaUsageAction(image.url);
        setDeleteConfirmation({ image, usage });
      } catch (error) {
        toast.error("Failed to check image usage", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  return (
    <div
      key={media.id}
      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/20 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <Image
        src={media.url}
        alt={media.name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />

      <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="size-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                onClick={() => setSelectedImageForPreview(media)}
              >
                <IconEye className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="size-9 rounded-lg bg-destructive/80 backdrop-blur flex items-center justify-center text-white hover:bg-destructive transition-colors"
                onClick={() => handleDeleteClick(media)}
                disabled={isPending}
              >
                <IconTrash className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
        <p className="truncate text-xs font-medium text-white">
          {media.name}
        </p>
      </div>



      <ImagePreviewDialog
        image={selectedImageForPreview}
        onOpenChange={(open) => {
          if (!open) setSelectedImageForPreview(null);
        }}
        onDelete={handleDeleteClick}
      />

      <DeleteConfirmationDialog
        image={deleteConfirmation?.image || null}
        usage={deleteConfirmation?.usage || null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation(null);
        }}
        onDeleteSuccess={() => {
          setSelectedImageForPreview(null);
        }}
      />
    </div>
  )
}

export default MediaCard;