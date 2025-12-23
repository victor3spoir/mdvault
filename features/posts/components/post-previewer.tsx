"use client";

import { IconCode, IconEye } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Post } from "../posts.types";
import { ForwardRefPreviewer } from "./forward-ref-previewer";

type ViewMode = "preview" | "code";

const PostPreviewer = ({ post }: { post: Post }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b bg-muted/30 rounded-t-lg p-2">
        <Button
          variant={viewMode === "preview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("preview")}
          className="gap-2"
        >
          <IconEye className="size-4" />
          Preview
        </Button>
        <Button
          variant={viewMode === "code" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("code")}
          className="gap-2"
        >
          <IconCode className="size-4" />
          Raw Markdown
        </Button>
      </div>

      {/* Preview Content */}
      {viewMode === "preview" ? (
        <div className="rounded-b-lg border bg-card p-8 mdx-preview">
          <ForwardRefPreviewer
            markdown={post.content}
            contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none"
          />
        </div>
      ) : (
        <div className="rounded-b-lg border bg-card p-8">
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground overflow-x-auto">
            {post.content}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PostPreviewer;
