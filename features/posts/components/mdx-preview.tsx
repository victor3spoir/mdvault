"use client";

import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, linkPlugin, linkDialogPlugin, tablePlugin, frontmatterPlugin, codeBlockPlugin, codeMirrorPlugin, imagePlugin } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface MDXPreviewProps {
  markdown: string;
}

export default function MDXPreview({ markdown }: MDXPreviewProps) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <MDXEditor
        readOnly
        markdown={markdown}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "typescript" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              jsx: "JavaScript (JSX)",
              ts: "TypeScript",
              tsx: "TypeScript (TSX)",
              css: "CSS",
              html: "HTML",
              json: "JSON",
              markdown: "Markdown",
              python: "Python",
              bash: "Bash",
              shell: "Shell",
            },
          }),
          imagePlugin({
            imageAutocompleteSuggestions: [],
          }),
        ]}
        className="mdx-editor-wrapper"
      />
    </div>
  );
}
