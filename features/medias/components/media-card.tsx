import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MediaFile } from "../medias.types";
import { IconEye, IconTrash } from "@tabler/icons-react";
import { MediaPreviewDialog } from "./image-preview-dialog";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MediaDeleteDialog } from "./media-delete-dialog";

const Image = dynamic(() => import("next/image"), { ssr: false });

const MediaCard = ({ media }: { media: MediaFile }) => {



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
            </TooltipTrigger>
            <MediaPreviewDialog image={media}>
              <Button><IconEye className="size-4" /></Button>
            </MediaPreviewDialog>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <MediaDeleteDialog image={media}>
                <Button
                  type="button"
                  className="size-9 rounded-lg bg-destructive/80 backdrop-blur flex items-center justify-center text-white hover:bg-destructive transition-colors"
                >
                  <IconTrash className="size-4" />
                </Button>
              </MediaDeleteDialog>
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

    </div>
  )
}

export default MediaCard;