import type { SearchParams } from "nuqs/server";
import { listArticlesAction } from "@/features/articles/articles.actions";
import { articlesSearchParamsCache, loadArticlesFilteringParams } from "@/features/articles/articles.search-params";
import { ArticlesList } from "@/features/articles/components/articles-list";
import PageLayout from "@/features/shared/components/page-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

interface ArticlesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page({
  searchParams,
}: ArticlesPageProps) {
  await articlesSearchParamsCache.parse(searchParams);
  // const results = await loadArticlesFilteringParams(searchParams)

  // await loadArticlesFilteringParams(searchParams)
  const articleResults = await listArticlesAction();

  if (!articleResults.success) {
    return <div>Not found</div>
  }
  const articles = articleResults.data;

  return (
    <PageLayout
      title="Articles"
      description="Manage your content, drafts, and published articles."
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Articles" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden h-6 rounded-lg px-2 text-xs font-bold sm:flex"
          >
            {articles.length} Articles
          </Badge>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg px-3 shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <Link href="/cms/articles/new" className="gap-2">
              <IconPlus className="size-4" />
              <span className="hidden sm:inline">Create Article</span>
            </Link>
          </Button>
        </div>
      }
    >
      <ArticlesList initialArticles={articles} />

    </PageLayout>
  )
}
