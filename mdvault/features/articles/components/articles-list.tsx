import { IconFileText } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Article } from "@/features/articles/articles.types";
import { ArticleCard } from "@/features/articles/components/article-card";
import ArticleSearchBar from "./article-search-bar";

interface ArticlesListProps {
  filteredArticles: Article[];
  allTags: string[];
}

export function ArticlesList({ filteredArticles, allTags }: ArticlesListProps) {
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
        <div className="flex min-h-100 items-center justify-center rounded-3xl border border-dashed bg-muted/30">
          <EmptyState
            icon={<IconFileText className="size-6" />}
            title="No articles found"
            description="Try adjusting your filters or search query to find what you're looking for."
          />
        </div>
      )}
    </div>
  );
}
