import { IconFileText, IconSearchOff } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Article } from "@/features/articles/articles.types";
import { ArticleCard } from "@/features/articles/components/article-card";
import ArticleSearchBar from "./article-search-bar";
import { articlesSearchParamsCache } from "../articles.search-params";
import type { SearchParams } from "nuqs/server";

interface ArticlesListProps {
  filteredArticles: Article[];
  allTags: string[];
  searchParams: SearchParams;
}

export function ArticlesList({
  filteredArticles,
  allTags,
  searchParams,
}: ArticlesListProps) {
  const { searchQuery, status, tags, lang } =
    articlesSearchParamsCache.parse(searchParams);

  const isFiltered = !!(
    searchQuery ||
    (status && status !== "all") ||
    (tags && tags.length > 0) ||
    (lang && lang !== "all")
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <ArticleSearchBar allTags={allTags} />

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-100 items-center justify-center rounded-3xl border border-dashed bg-muted/30 p-12">
          {isFiltered ? (
            <EmptyState
              icon={<IconSearchOff className="size-8" />}
              title="No results found"
              description="We couldn't find any articles matching your current filters. Try clearing them or using different terms."
              action={{
                label: "Clear Search",
                href: "/cms/articles",
              }}
            />
          ) : (
            <EmptyState
              icon={<IconFileText className="size-8" />}
              title="Start writing articles"
              description="Your vault is currently empty. Create your first article to see it appear here."
              action={{
                label: "Create Article",
                href: "/cms/articles/new",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
