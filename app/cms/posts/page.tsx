import Link from 'next/link'
import PageLayout from '@/features/shared/components/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { IconPlus, IconSearch, IconFilter, IconFileText, IconCalendar } from '@tabler/icons-react'
import { listPostsAction } from '@/features/posts/actions/posts.actions'

export default async function PostsPage() {
  const posts = await listPostsAction()

  return (
    <PageLayout
      title="Posts"
      description="Manage your blog posts and articles"
      breadcrumbs={[
        { label: 'Dashboard', href: '/cms' },
        { label: 'Posts' },
      ]}
      actions={
        <Button asChild className="gap-2">
          <Link href="/cms/posts/new">
            <IconPlus className="size-4" />
            New Post
          </Link>
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <IconFilter className="size-4" />
            Filter
          </Button>
          <Badge variant="secondary">{posts.length} posts</Badge>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <IconFileText className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No posts yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first post. You can write in Markdown with
            full support for images, tables, and code blocks.
          </p>
          <Button asChild>
            <Link href="/cms/posts/new">Create First Post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const formattedDate = new Date(post.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <div
                key={post.slug}
                className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
              >
                {post.coverImage && (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={post.published ? 'default' : 'secondary'}>
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                    {post.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="mb-2 text-lg font-semibold leading-tight line-clamp-2">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconCalendar className="size-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t pt-4">
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/cms/posts/${post.slug}` as '/'}>View</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/cms/posts/${post.slug}/edit` as '/'}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}