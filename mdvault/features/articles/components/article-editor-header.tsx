"use client";

import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCloud,
  IconCloudOff,
  IconDeviceFloppy,
  IconEye,
  IconFileText,
  IconLoader2,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ARTICLE_LABELS,
  ARTICLE_ROUTES,
  ARTICLE_STATUS,
} from "../articles.constants";
import type { Article } from "../articles.types";
import ArticleDeleteDialog from "./article-delete-dialog";
import { ArticlePublishDialog } from "./article-publish-dialog";

interface ArticleEditorHeaderProps {
  readonly title: string;
  readonly id?: string;
  readonly mode: "create" | "edit";
  readonly article?: Article;
  readonly isSaving: boolean;
  readonly hasUnsavedChanges: boolean;
  readonly sidebarCollapsed: boolean;
  readonly onSave: () => void;
  readonly onToggleSidebar: () => void;
}

export function ArticleEditorHeader({
  title,
  mode,
  article,
  isSaving,
  hasUnsavedChanges,
  sidebarCollapsed,
  onSave,
  onToggleSidebar,
}: ArticleEditorHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Left: Back & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              asChild
            >
              <Link href={ARTICLE_ROUTES.LIST}>
                <IconArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {ARTICLE_LABELS.BACK_TO_ARTICLES}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5" />

        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href={ARTICLE_ROUTES.LIST}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Articles
          </Link>
          <IconChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="max-w-50 truncate font-medium">
            {title || "Untitled"}
          </span>
        </nav>

        {/* Status Indicator */}
        <div className="ml-3 flex items-center gap-2">
          {article?.published ? (
            <Badge
              variant="secondary"
              className="h-5 gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            >
              <IconCheck className="size-3" />
              {ARTICLE_STATUS.PUBLISHED}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="h-5 gap-1 rounded-full bg-amber-500/10 px-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"
            >
              <IconFileText className="size-3" />
              {ARTICLE_STATUS.DRAFT}
            </Badge>
          )}

          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCloudOff className="size-3" />
              {ARTICLE_STATUS.UNSAVED}
            </span>
          )}
          {!hasUnsavedChanges && mode === "edit" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCloud className="size-3" />
              {ARTICLE_STATUS.SAVED}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {mode === "edit" && (
          <Tooltip>
            <TooltipTrigger asChild>
              {article?.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-muted-foreground"
                  asChild
                >
                  <a
                    href={ARTICLE_ROUTES.PREVIEW(article.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconEye className="size-3.5" />
                    <span className="hidden sm:inline">
                      {ARTICLE_LABELS.PREVIEW}
                    </span>
                  </a>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-8 gap-1.5 rounded-lg text-muted-foreground"
                >
                  <IconEye className="size-3.5" />
                  <span className="hidden sm:inline">
                    {ARTICLE_LABELS.PREVIEW}
                  </span>
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {article?.id
                ? ARTICLE_LABELS.PREVIEW_ARTICLE
                : "Save article first to preview"}
            </TooltipContent>
          </Tooltip>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !title}
          className="h-8 gap-1.5 rounded-lg"
        >
          {isSaving ? (
            <IconLoader2 className="size-3.5 animate-spin" />
          ) : (
            <IconDeviceFloppy className="size-3.5" />
          )}
          <span className="hidden sm:inline">{ARTICLE_LABELS.SAVE}</span>
        </Button>

        

        {mode === "edit" && article && (
          <>
            <ArticlePublishDialog article={article}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg"
              >
                {article.published ? (
                  <>
                    <IconX className="size-3.5" />
                    <span className="hidden sm:inline">
                      {ARTICLE_LABELS.UNPUBLISH}
                    </span>
                  </>
                ) : (
                  <>
                    <IconCheck className="size-3.5" />
                    <span className="hidden sm:inline">
                      {ARTICLE_LABELS.PUBLISH}
                    </span>
                  </>
                )}
              </Button>
            </ArticlePublishDialog>

            <ArticleDeleteDialog
              articleSha={article.sha}
              articleId={article.id}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-destructive hover:text-destructive"
              >
                <IconTrash className="size-3.5" />
                <span className="hidden sm:inline">{ARTICLE_LABELS.DELETE}</span>
              </Button>
            </ArticleDeleteDialog>
          </>
        )}

        {/* Settings sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sidebarCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={onToggleSidebar}
            >
              <IconSettings className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {sidebarCollapsed
              ? ARTICLE_LABELS.SHOW_SETTINGS
              : ARTICLE_LABELS.HIDE_SETTINGS}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
