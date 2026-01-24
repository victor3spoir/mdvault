import { Badge } from "@/components/ui/badge";
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenu } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconSearch, IconFilter, IconSortAscending, IconSortDescending, IconCalendar, IconFileText, IconX } from "@tabler/icons-react";
import { StatusFilter, SortBy, SortOrder, articlesSearchParams } from "../articles.search-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryStates } from "nuqs";

const ArticleSearchBar = ({ allTags }: { allTags: string[] }) => {

  const [{ tags, searchQuery, status, sortOrder }, setParams] =
    useQueryStates(articlesSearchParams)

  const toggleTag = (tag: string) => {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setParams({ tags: newTags });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles by title, tags or description..."
            value={searchQuery}
            onChange={(e) => setParams({ searchQuery: e.target.value })}
            className="h-11 rounded-2xl border-none bg-muted/50 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onValueChange={(value: StatusFilter) =>
              setParams({ status: value })
            }
          >
            <SelectTrigger className="h-11 w-35 rounded-2xl border-none bg-muted/50 focus:ring-1 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <IconFilter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-muted">
              <SelectItem value="all" className="rounded-xl">
                All Status
              </SelectItem>
              <SelectItem value="published" className="rounded-xl">
                Published
              </SelectItem>
              <SelectItem value="draft" className="rounded-xl">
                Drafts
              </SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
              >
                {sortOrder === "asc" ? (
                  <IconSortAscending className="size-5" />
                ) : (
                  <IconSortDescending className="size-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-muted"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Sort by
              </div>
              <DropdownMenuItem
                onClick={() => setParams({ sortBy: "date" as SortBy })}
                className="gap-2 rounded-xl"
              >
                <IconCalendar className="size-4" /> Date
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setParams({ sortBy: "title" as SortBy })}
                className="gap-2 rounded-xl"
              >
                <IconFileText className="size-4" /> Title
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Order
              </div>
              <DropdownMenuItem
                onClick={() => setParams({ sortOrder: "asc" as SortOrder })}
                className="gap-2 rounded-xl"
              >
                <IconSortAscending className="size-4" /> Ascending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setParams({ sortOrder: "desc" as SortOrder })
                }
                className="gap-2 rounded-xl"
              >
                <IconSortDescending className="size-4" /> Descending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer rounded-lg px-3 py-1 transition-all hover:bg-primary/10 hover:text-primary"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              {tags.includes(tag) && (
                <IconX className="ml-1.5 size-3" />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default ArticleSearchBar;