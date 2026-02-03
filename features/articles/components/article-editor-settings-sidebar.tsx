"use client";

import {
  IconFileText,
  IconHash,
  IconPhoto,
  IconPlus,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CoverImageSelector } from "../../medias/components/cover-image-selector";
import { EDITOR_CONFIG } from "../articles.constants";

interface ArticleSettingsSidebarProps {
  readonly slug: string;
  readonly description: string;
  readonly tags: string[];
  readonly tagInput: string;
  readonly coverImage: string;
  readonly mode: "create" | "edit";
  readonly collapsed: boolean;
  readonly onSlugChange: (slug: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onTagInputChange: (tagInput: string) => void;
  readonly onAddTag: () => void;
  readonly onRemoveTag: (tag: string) => void;
  readonly onCoverImageChange: (url: string) => void;
  readonly onCollapse: () => void;
}

export function ArticleEditorSettingsSidebar({
  slug,
  description,
  tags,
  tagInput,
  coverImage,
  mode,
  collapsed,
  onSlugChange,
  onDescriptionChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onCoverImageChange,
  onCollapse,
}: ArticleSettingsSidebarProps) {
  return (
    <aside
      className={cn(
        "shrink-0 border-l bg-muted/20 transition-all duration-300 ease-in-out",
        collapsed ? "w-0 overflow-hidden" : "w-80",
      )}
    >
      <div className="flex h-full w-80 flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <h3 className="text-sm font-semibold">Article Settings</h3>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg"
            onClick={onCollapse}
          >
            <IconX className="size-3.5" />
          </Button>
        </div>

        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {/* URL Slug */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconHash className="size-3.5" />
                URL Slug
              </Label>
              <Input
                placeholder="article-url-slug"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                disabled={mode === "edit"}
                className="h-9 rounded-lg border-muted bg-background text-sm"
              />
              {slug && (
                <p className="text-[11px] text-muted-foreground">
                  /articles/{slug}
                </p>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconFileText className="size-3.5" />
                Description
              </Label>
              <Textarea
                placeholder="Brief description for SEO and previews..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={3}
                className="rounded-lg border-muted bg-background text-sm resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {description.length}/{EDITOR_CONFIG.DESCRIPTION_MAX_LENGTH} characters
              </p>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconTag className="size-3.5" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => onTagInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddTag();
                    }
                  }}
                  className="h-9 rounded-lg border-muted bg-background text-sm"
                />
                <Button
                  onClick={onAddTag}
                  size="icon"
                  variant="secondary"
                  className="size-9 shrink-0 rounded-lg"
                  disabled={!tagInput.trim()}
                >
                  <IconPlus className="size-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="h-6 gap-1 rounded-md bg-background px-2 text-[11px] font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <IconX className="size-2.5" />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-[11px] italic text-muted-foreground">
                    No tags added
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Cover Image */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconPhoto className="size-3.5" />
                Cover Image
              </Label>
              <div className="h-full max-h-[100px]">
                <CoverImageSelector
                  selectedImageUrl={coverImage}
                  onSelectImage={(image) => onCoverImageChange(image.url)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
