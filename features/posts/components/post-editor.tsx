'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { ForwardRefEditor } from './forward-ref-editor'
import { CoverImageSelector } from '../../medias/components/cover-image-selector'
import { ImageInsertDialog } from '../../medias/components/image-insert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  IconDeviceFloppy,
  IconSend,
  IconArrowLeft,
  IconX,
  IconPlus,
  IconTrash,
  IconEyeOff,
} from '@tabler/icons-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Post } from '../posts.types'
import { createPostAction, updatePostAction, deletePostAction, unpublishPostAction } from '../posts.actions'
import { uploadImageAction } from '../../medias/medias.actions'
import type { UploadedImage } from "@/features/medias/medias.types"

interface PostEditorProps {
  post?: Post
  mode: 'create' | 'edit'
}

export function PostEditor({ post, mode }: PostEditorProps) {
  const router = useRouter()
  const editorRef = useRef<MDXEditorMethods>(null)

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [description, setDescription] = useState(post?.description ?? '')
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [imageInsertDialogOpen, setImageInsertDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false)

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'create') {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }

  // Tag management
  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Image upload handler for MDXEditor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const uploadedImage = await uploadImageAction(file)
    return uploadedImage.url
  }, [])

  // Handle image insert from dialog
  const handleImageInsert = (image: UploadedImage) => {
    if (editorRef.current) {
      editorRef.current.insertMarkdown(`![image](${image.url})`)
    }
    setImageInsertDialogOpen(false)
  }

  // Save as draft
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const content = editorRef.current?.getMarkdown() ?? ''
      const input: CreatePostInput = {
        title,
        slug,
        content,
        description,
        tags,
        coverImage,
        published: false,
      }

      if (mode === 'create') {
        await createPostAction(input)
      } else if (post?.sha) {
        await updatePostAction(slug, { ...input, sha: post.sha })
      }

      toast.success('Post saved as draft')
      router.push('/cms/posts')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save post'
      toast.error(message)
      console.error('Error saving post:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Publish post
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const content = editorRef.current?.getMarkdown() ?? ''
      const input: CreatePostInput = {
        title,
        slug,
        content,
        description,
        tags,
        coverImage,
        published: true,
      }

      if (mode === 'create') {
        await createPostAction(input)
      } else if (post?.sha) {
        await updatePostAction(slug, { ...input, sha: post.sha })
      }

      toast.success('Post published successfully')
      router.push('/cms/posts')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish post'
      toast.error(message)
      console.error('Error publishing post:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  // Delete post
  const handleDelete = async () => {
    if (!post?.sha) return
    setIsDeleting(true)
    try {
      await deletePostAction(slug, post.sha)
      toast.success('Post deleted successfully')
      router.push('/cms/posts')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete post'
      toast.error(message)
      console.error('Error deleting post:', error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Unpublish post
  const handleUnpublish = async () => {
    if (!post?.sha) return
    setIsUnpublishing(true)
    try {
      await unpublishPostAction(slug, post.sha)
      toast.success('Post unpublished successfully')
      router.refresh()
      setUnpublishDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unpublish post'
      toast.error(message)
      console.error('Error unpublishing post:', error)
    } finally {
      setIsUnpublishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <IconArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {mode === 'edit' && post?.published && (
            <Button
              variant="outline"
              onClick={() => setUnpublishDialogOpen(true)}
              disabled={isUnpublishing}
              className="gap-2"
            >
              <IconEyeOff className="size-4" />
              {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !title || !slug}
            className="gap-2"
          >
            <IconDeviceFloppy className="size-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          {!post?.published && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !title || !slug}
              className="gap-2"
            >
              <IconSend className="size-4" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              size="icon"
              className="gap-2"
            >
              <IconTrash className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Section */}
      <div className="grid gap-6 rounded-xl border bg-card p-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter post title..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="post-url-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={mode === 'edit'}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of your post..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Cover Image</Label>
          <CoverImageSelector
            selectedImageUrl={coverImage}
            onSelectImage={(image: UploadedImage) => setCoverImage(image.url || '')}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addTag}>
              <IconPlus className="size-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <IconX className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Section */}
      <div className="rounded-xl border bg-card">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="font-medium">Content</h3>
          <p className="text-sm text-muted-foreground">
            Write your post content using the rich text editor below
          </p>
        </div>
        <div className="min-h-125">
          <ForwardRefEditor
            ref={editorRef}
            markdown={post?.content ?? '# Start writing...\n\nYour content goes here.'}
            onImageUpload={handleImageUpload}
            onImageInsertClick={() => setImageInsertDialogOpen(true)}
            contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none p-6 min-h-[500px] focus:outline-none"
          />
        </div>
      </div>

      {/* Image Insert Dialog */}
      <ImageInsertDialog
        open={imageInsertDialogOpen}
        onClose={() => setImageInsertDialogOpen(false)}
        onSelect={handleImageInsert}
      />

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Post Confirmation Dialog */}
      <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish this post? It will no longer be visible to readers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
