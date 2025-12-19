import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageLayout from '@/features/shared/components/page-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPostAction } from '@/features/posts/posts.actions'
import { IconEdit, IconArrowLeft, IconCalendar, IconUser, IconTag } from '@tabler/icons-react'
import Image from 'next/image'
import PostPreviewer from '@/features/posts/components/post-previewer'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostAction(slug)

  if (!post) {
    notFound()
  }

  const formattedCreatedAt = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedUpdatedAt = new Date(post.updatedAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PageLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/cms' },
        { label: 'Posts', href: '/cms/posts' },
        { label: post.title },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/cms/posts">
              <IconArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/cms/posts/${slug}/edit` as '/'}>
              <IconEdit className="size-4" />
              Edit Post
            </Link>
          </Button>
        </div>
      }
    >
      <article className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={post.published ? 'default' : 'secondary'}>
              {post.published ? 'Published' : 'Draft'}
            </Badge>
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                <IconTag className="mr-1 size-3" />
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>

          {post.description && (
            <p className="text-xl text-muted-foreground">{post.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <IconUser className="size-4" />
                {post.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <IconCalendar className="size-4" />
              Created {formattedCreatedAt}
            </span>
            {post.updatedAt !== post.createdAt && (
              <span className="flex items-center gap-1.5">
                <IconCalendar className="size-4" />
                Updated {formattedUpdatedAt}
              </span>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl bg-muted">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Image src={post.coverImage} alt={post.title} width={200} height={200}
                className='w-full' />
            </div>
          </div>
        )}

        {/* Content */}
        <PostPreviewer post={post}/>
      </article>
    </PageLayout>
  )
}
