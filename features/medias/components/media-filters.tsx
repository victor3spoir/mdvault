"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaFilteringParams } from "../medias.types";

interface MediaFiltersProps {
  imageTypes: string[];
}

export default function MediaFilters({ imageTypes }: MediaFiltersProps) {
  const [{ search, filter }, setMediaFilters] = useQueryStates(mediaFilteringParams, {
    shallow: false,
  })


  const hasActiveFilters = search || filter !== "all";

  const resetFilters = () => {
    setMediaFilters({ search: "", filter: "" })
  };

  return (
    <div className="space-y-3 rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets by filename..."
          value={search}
          onChange={(e) => setMediaFilters({ search: e.target.value })}
          className="h-10 rounded-lg border-none bg-muted/50 pl-9 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setMediaFilters({ search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <IconX className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Filter:
        </span>
        <Button
          type="button"
          variant={filter === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMediaFilters({ filter: "all" })}
          className="h-8 rounded-lg px-3 text-xs"
        >
          All
        </Button>
        {imageTypes.map((type) => (
          <Button
            key={type}
            type="button"
            variant={filter === type ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMediaFilters({ filter: type })}
            className="h-8 rounded-lg px-3 text-xs uppercase"
          >
            {type}
          </Button>
        ))}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-2 ml-auto"
          >
            <IconX className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

