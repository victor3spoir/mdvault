'use client'

import type { ForwardedRef } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

export interface InitializedMDXPreviewerProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null
}

export default function InitializedMDXPreviewer({
  editorRef,
  ...props
}: InitializedMDXPreviewerProps) {
  return (
    <MDXEditor
      readOnly
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
        codeBlockPlugin({ defaultCodeBlockLanguage: 'typescript' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            jsx: 'JavaScript (JSX)',
            ts: 'TypeScript',
            tsx: 'TypeScript (TSX)',
            css: 'CSS',
            html: 'HTML',
          },
        }),
        imagePlugin({
          imageAutocompleteSuggestions: [],
        }),
      ]}
      {...props}
      ref={editorRef}
      className="mdx-editor-wrapper"
    />
  )
}
