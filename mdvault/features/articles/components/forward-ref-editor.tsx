"use client";

import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import { forwardRef } from "react";

const Editor = dynamic(() => import("./initialized-mdx-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center min-h-0 border border-border rounded-lg bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading editor...</span>
      </div>
    </div>
  ),
});

export interface ForwardRefEditorProps extends MDXEditorProps {
  onImageUpload?: (file: File) => Promise<string>;
  onImageInsertClick?: () => void;
  imagePreviewHandler?: (imageSource: string) => Promise<string>;
}

export const ForwardRefEditor = forwardRef<
  MDXEditorMethods,
  ForwardRefEditorProps
>((props, ref) => <Editor {...props} editorRef={ref} />);

ForwardRefEditor.displayName = "ForwardRefEditor";
