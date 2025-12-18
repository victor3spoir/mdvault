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
  toolbarPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertFrontmatter,
  Separator,
  DiffSourceToggleWrapper,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

export interface InitializedMDXEditorProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null
  onImageUpload?: (file: File) => Promise<string>
}

export default function InitializedMDXEditor({
  editorRef,
  onImageUpload,
  ...props
}: InitializedMDXEditorProps) {
  const imageUploadHandler = async (image: File): Promise<string> => {
    if (onImageUpload) {
      return onImageUpload(image)
    }
    // Default: return a placeholder URL
    return URL.createObjectURL(image)
  }

  return (
    <MDXEditor
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
            json: 'JSON',
            markdown: 'Markdown',
            python: 'Python',
            bash: 'Bash',
            shell: 'Shell',
          },
        }),
        imagePlugin({
          imageUploadHandler,
          imageAutocompleteSuggestions: [],
        }),
        diffSourcePlugin({
          viewMode: 'rich-text',
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <Separator />
              <ListsToggle />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertThematicBreak />
              <Separator />
              <InsertFrontmatter />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
      {...props}
      ref={editorRef}
      className="mdx-editor-wrapper"
    />
  )
}
