import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { IconPhotoPlus } from "@tabler/icons-react";
import { MediaUploader } from "./media-uploader";
import { Button } from "@/components/ui/button";

const MediaUploadSheet = () => {
  
  return (
    // <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
    //   <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              className="h-10 gap-2 rounded-lg px-4 font-semibold"
            >
              <IconPhotoPlus className="size-4" />
              Upload Asset
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader className="pb-8">
              <SheetTitle className="text-xl font-bold">
                Upload Asset
              </SheetTitle>
              <SheetDescription>
                Add new images to your media library
              </SheetDescription>
            </SheetHeader>
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
              <MediaUploader />
            </div>
          </SheetContent>
        </Sheet>
    //   </div>
    // </div>
  )
}

export default MediaUploadSheet;