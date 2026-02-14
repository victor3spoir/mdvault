import { IconArrowLeft, IconFileText } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticleAction } from "@/features/articles/articles.actions";
import { getPostAction } from "@/features/posts/posts.actions";
import PageLayout from "@/features/shared/components/page-layout";
import { formatDate } from "@/features/shared/shared.utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const postResult = await getPostAction(slug);

  if (!postResult.success) {
    return <div>Post not found</div>;
  }

  const post = postResult.data;

  // Fetch linked article if exists
  let linkedArticle = null;
  if (post.article) {
    const articleResult = await getArticleAction(post.article);
    if (articleResult.success) {
      linkedArticle = articleResult.data;
    }
  }

  return (
    <PageLayout
      title={post.title}
      description={post.content.substring(0, 100)}
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/posts" },
        { label: post.title },
      ]}
    >
      <div className="max-w-2xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/cms/posts">
            <IconArrowLeft className="size-4 mr-2" />
            Back to Posts
          </Link>
        </Button>

        {post.coverImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl mb-6 bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <div className="flex items-center gap-3 text-muted-foreground text-sm mt-2">
                <span>{formatDate(new Date(post.createdAt))}</span>
                {post.author && <span>• By {post.author}</span>}
                <Badge variant="outline" className="text-[10px]">
                  {post.lang === "fr" ? "Français" : "English"}
                </Badge>
              </div>
            </div>
            <Badge variant={post.published ? "default" : "secondary"}>
              {post.published ? "Published" : "Draft"}
            </Badge>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none mt-6">
            <p className="whitespace-pre-wrap text-foreground">
              {post.content}
            </p>
          </div>

          {linkedArticle && (
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-sm mb-2">
                <IconFileText className="size-4" />
                <span className="font-semibold">Related Article</span>
              </div>
              <Link
                href={`/cms/articles/${linkedArticle.id}`}
                className="text-primary hover:underline"
              >
                {linkedArticle.title}
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
