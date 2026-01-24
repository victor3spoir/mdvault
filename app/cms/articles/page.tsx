import type { SearchParams } from "nuqs/server";
import { listArticlesAction } from "@/features/articles/articles.actions";
import { loadArticlesFilteringParams } from "@/features/articles/articles.search-params";
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
  const { searchQuery, status, sortBy, sortOrder, tags } = await loadArticlesFilteringParams(searchParams);

  const articleResults = await listArticlesAction();

  if (!articleResults.success) {
    return <div>Not found</div>;
  }

  const allArticles = articleResults.data;

  // Server-side filtering
  const filteredArticles = allArticles
    .filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        status === "all" ||
        (status === "published" ? article.published : !article.published);

      const matchesTags =
        tags.length === 0 ||
        (article.tags && tags.some((tag) => article.tags?.includes(tag)));

      return matchesSearch && matchesStatus && matchesTags;
    })
    .sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          modifier
        );
      }
      return a.title.localeCompare(b.title) * modifier;
    });

  // Get all unique tags for filter
  const allTags = Array.from(
    new Set(
      allArticles
        .flatMap((article) => article.tags || [])
        .sort()
    )
  );

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
            {filteredArticles.length} Articles
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
      <ArticlesList filteredArticles={filteredArticles} allTags={allTags} />
    </PageLayout>
  );
}
