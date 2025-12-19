'use client'

import type React from 'react'
import type { Post } from '../types'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { IconEye, IconCode } from '@tabler/icons-react'

type ViewMode = 'preview' | 'code'

// Simple markdown to JSX converter
const parseMarkdown = (markdown: string) => {
  const lines = markdown.split('\n')
  const elements: React.ReactNode[] = []
  let currentParagraph: string[] = []
  let codeBlockActive = false
  let codeBlockContent = ''
  let keyCounter = 0

  lines.forEach((line) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (codeBlockActive) {
        elements.push(
          <pre key={`code-${keyCounter++}`} className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
            <code className="text-sm">{codeBlockContent}</code>
          </pre>
        )
        codeBlockContent = ''
        codeBlockActive = false
      } else {
        codeBlockActive = true
      }
      return
    }

    if (codeBlockActive) {
      codeBlockContent += line + '\n'
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      if (currentParagraph.length) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="my-4">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="text-lg font-semibold mt-6 mb-3">
          {line.slice(4)}
        </h3>
      )
      return
    }

    if (line.startsWith('## ')) {
      if (currentParagraph.length) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="my-4">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      elements.push(
        <h2 key={`h2-${keyCounter++}`} className="text-2xl font-bold mt-8 mb-4">
          {line.slice(3)}
        </h2>
      )
      return
    }

    if (line.startsWith('# ')) {
      if (currentParagraph.length) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="my-4">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      elements.push(
        <h1 key={`h1-${keyCounter++}`} className="text-3xl font-bold mt-10 mb-4">
          {line.slice(2)}
        </h1>
      )
      return
    }

    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentParagraph.length) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="my-4">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      elements.push(
        <li key={`li-${keyCounter++}`} className="ml-6 my-2">
          {line.slice(2)}
        </li>
      )
      return
    }

    // Empty lines
    if (line.trim() === '') {
      if (currentParagraph.length) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="my-4">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      return
    }

    // Regular text
    currentParagraph.push(line)
  })

  // Add remaining paragraph
  if (currentParagraph.length) {
    elements.push(
      <p key={`p-${keyCounter++}`} className="my-4">
        {currentParagraph.join(' ')}
      </p>
    )
  }

  return elements
}

const PostPreviewer = ({ post }: { post: Post }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')

  const previewContent = useMemo(() => parseMarkdown(post.content), [post.content])

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b bg-muted/30 rounded-t-lg p-2">
        <Button
          variant={viewMode === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('preview')}
          className="gap-2"
        >
          <IconEye className="size-4" />
          Preview
        </Button>
        <Button
          variant={viewMode === 'code' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('code')}
          className="gap-2"
        >
          <IconCode className="size-4" />
          Raw Markdown
        </Button>
      </div>

      {/* Preview Content */}
      {viewMode === 'preview' ? (
        <div className="prose prose-neutral dark:prose-invert max-w-none rounded-b-lg border bg-card p-8">
          <div>{previewContent}</div>
        </div>
      ) : (
        <div className="rounded-b-lg border bg-card p-8">
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground overflow-x-auto">
            {post.content}
          </pre>
        </div>
      )}
    </div>
  )
}

export default PostPreviewer