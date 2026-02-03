import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { getArticleAction } from "@/features/articles/articles.actions";
import { MDXContent } from "@/lib/mdx";
import PageLayout from "@/features/shared/components/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Readonly<ArticlePageProps>) {
  const { id } = await params;
  const result = await getArticleAction(id);

  if (!result.success) {
    notFound();
  }

  const article = result.data;
  const editHref = `/cms/articles/${id}/edit` as const;

  return (
    <PageLayout
      title={article.title}
      description={article.description}
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Articles", href: "/cms/articles" },
        { label: article.title },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cms/articles">
              <IconArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <a href={editHref}>
              <IconEdit className="mr-2 size-4" />
              Edit
            </a>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Article metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={article.published ? "default" : "secondary"}>
            {article.published ? "Published" : "Draft"}
          </Badge>
          {article.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Article info */}
        <div className="text-muted-foreground text-sm">
          {article.author && <span>By {article.author}</span>}
          {article.author && article.createdAt && <span> • </span>}
          {article.createdAt && (
            <span>
              Created {new Date(article.createdAt).toLocaleDateString()}
            </span>
          )}
          {article.publishedAt && (
            <span>
              {" "}
              • Published {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Cover image */}
        {article.coverImage && (
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        
        <article className="prose dark:prose-invert max-w-none">
          <MDXContent source={article.content} />
        </article>
      </div>
    </PageLayout>
  );
}
