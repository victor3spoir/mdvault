import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconTag,
  IconUser,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticleAction } from "@/features/articles/articles.actions";
import { TableOfContents } from "@/features/articles/components/table-of-contents";
import PageLayout from "@/features/shared/components/page-layout";
import { MDXContent } from "@/lib/mdx";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const article = await getArticleAction(slug);

  if (!article) {
    notFound();
  }

  const formattedCreatedAt = new Date(article.createdAt).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const formattedUpdatedAt = new Date(article.updatedAt).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Posts", href: "/cms/articles" },
        { label: article.title },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/cms/articles">
              <IconArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/cms/articles/${slug}/edit` as "/"}>
              <IconEdit className="size-4" />
              Edit Article
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex gap-8">
        <article className="flex-1 min-w-0">
          {/* Header */}
          <header className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={article.published ? "default" : "secondary"}>
                {article.published ? "Published" : "Draft"}
              </Badge>
              {article.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  <IconTag className="mr-1 size-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {article.author && (
                <span className="flex items-center gap-1.5">
                  <IconUser className="size-4" />
                  {article.author}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <IconCalendar className="size-4" />
                Created {formattedCreatedAt}
              </span>
              {article.updatedAt !== article.createdAt && (
                <span className="flex items-center gap-1.5">
                  <IconCalendar className="size-4" />
                  Updated {formattedUpdatedAt}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              {article.title}
            </h1>

            {article.description && (
              <p className="text-xl text-muted-foreground">
                {article.description}
              </p>
            )}
          </header>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  width={200}
                  height={200}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXContent source={article.content} />
          </div>
        </article>

        {/* Table of Contents Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
