"use client";

import {
  IconCalendar,
  IconCheck,
  IconEdit,
  IconEye,
  IconFileText,
  IconLoader2,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Article } from "@/features/articles/articles.types";
import { deleteArticleAction } from "../articles.actions";
import { ArticlePublishDialog } from "./article-publish-dialog";
import { PostMetadataEditor } from "./article-metadata-editor";
import { formatDate } from "@/features/shared/shared.utils";

interface ArticleCardProps {
  article: Article;
  onDelete?: (article: Article) => void;
}

export function ArticleCard({
  article,
  onDelete,
}: ArticleCardProps) {
  const [isPending, startTransition] = useTransition();


  const formattedDate = formatDate(new Date(article.createdAt))

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteArticleAction(
          article.slug,
          article.sha || "",
        );
        if (!result.success) {
          toast.error("Failed to delete", {
            description: result.error,
          });
          return;
        }
        toast.success("Article deleted", {
          description: `"${article.title}" has been removed`,
        });
        onDelete?.(article);
      } catch (error) {
        toast.error("Failed to delete", {
          description:
            error instanceof Error ? error.message : "Try again later",
        });
      }
    });
  };

  return (
    <TooltipProvider>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:border-primary/20">
        {/* Cover Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/50">
              <IconFileText className="size-10 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Status Badge on Image */}
          <div className="absolute left-3 top-3">
            <Badge
              variant={article.published ? "default" : "secondary"}
              className="h-6 gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md"
            >
              {article.published ? (
                <>
                  <IconCheck className="size-3" />
                  Published
                </>
              ) : (
                "Draft"
              )}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {article.tags?.slice(0, 2).map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {article.tags && article.tags.length > 2 && (
              <Badge
                variant="outline"
                className="rounded-lg border-muted bg-muted/30 px-2 py-0 text-[10px] font-medium text-muted-foreground"
              >
                +{article.tags.length - 2}
              </Badge>
            )}
          </div>

          <h3 className="mb-2 line-clamp-1 text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {article.description ||
              "No description provided for this article."}
          </p>

          <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 shrink-0">
              <IconCalendar className="size-3.5" />
              {formattedDate}
            </span>
            {article.author && (
              <span className="flex items-center gap-1.5 border-l pl-3 truncate">
                By {article.author}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4 gap-2">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/cms/articles/${article.slug}`}>
                      <IconEye className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View article</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href={`/cms/articles/${article.slug}/edit`}>
                      <IconEdit className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit article</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <PostMetadataEditor article={article}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <IconSettings className="size-4" />
                    </Button>
                  </PostMetadataEditor>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArticlePublishDialog article={article}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      {article.published ? (
                        <IconX className="size-4 text-amber-600" />
                      ) : (
                        <IconCheck className="size-4 text-emerald-600" />
                      )}
                    </Button>
                  </ArticlePublishDialog>
                </TooltipTrigger>
                <TooltipContent>
                  {article.published ? "Unpublish" : "Publish"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this article?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The article will be permanently removed.
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
                </TooltipTrigger>
                <TooltipContent>Delete article</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Loading Skeleton
export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
