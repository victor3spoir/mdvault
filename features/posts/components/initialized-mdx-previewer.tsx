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
  CodeMirrorEditor,
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
        codeBlockPlugin({ 
          defaultCodeBlockLanguage: 'ts',
          codeBlockEditorDescriptors: [{ priority: -10, match: () => true, Editor: CodeMirrorEditor }]
        }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            jsx: 'JSX',
            ts: 'TypeScript',
            tsx: 'TSX',
            css: 'CSS',
            html: 'HTML',
            python: 'Python',
            bash: 'Bash',
            json: 'JSON',
            md: 'Markdown',
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
