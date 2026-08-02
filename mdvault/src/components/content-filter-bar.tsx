import {
	IconFilter,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
	IconX,
} from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { ContentFilters } from "#/features/shared/content-filters";

interface ContentFilterBarProps {
	filters: ContentFilters;
	onChange: (patch: Partial<ContentFilters>) => void;
	/** Content noun used in placeholders and aria labels, e.g. "articles". */
	label: string;
	availableTags?: string[];
}

export function ContentFilterBar({
	filters,
	onChange,
	label,
	availableTags = [],
}: ContentFilterBarProps) {
	const toggleTag = (tag: string) => {
		const nextTags = filters.tags.includes(tag)
			? filters.tags.filter((value) => value !== tag)
			: [...filters.tags, tag];
		onChange({ tags: nextTags });
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<IconSearch className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={filters.searchQuery}
						onChange={(event) => onChange({ searchQuery: event.target.value })}
						placeholder={`Search ${label} by title, tags or content...`}
						aria-label={`Search ${label}`}
						className="h-11 rounded-2xl border-none bg-muted/50 pr-4 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Select
						value={filters.status}
						onValueChange={(value) =>
							onChange({ status: value as ContentFilters["status"] })
						}
					>
						<SelectTrigger
							aria-label={`Filter ${label} by status`}
							className="h-11 w-35 rounded-2xl border-muted bg-muted/50 px-4 font-normal hover:bg-muted/70"
						>
							<IconFilter className="size-4 text-muted-foreground" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="w-40 rounded-2xl">
							<SelectGroup>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="draft">Drafts</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>

					<Select
						value={filters.lang}
						onValueChange={(value) =>
							onChange({ lang: value as ContentFilters["lang"] })
						}
					>
						<SelectTrigger
							aria-label={`Filter ${label} by language`}
							className="h-11 w-40 rounded-2xl border-muted bg-muted/50 px-4 font-normal hover:bg-muted/70"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="w-40 rounded-2xl">
							<SelectGroup>
								<SelectItem value="all">All Languages</SelectItem>
								<SelectItem value="en">English</SelectItem>
								<SelectItem value="fr">Français</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Sort ${label} ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
								className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted"
							>
								{filters.sortOrder === "asc" ? (
									<IconSortAscending className="size-5" />
								) : (
									<IconSortDescending className="size-5" />
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48 rounded-2xl">
							<DropdownMenuLabel>Sort by</DropdownMenuLabel>
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => onChange({ sortBy: "date" })}>
									Date
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onChange({ sortBy: "title" })}>
									Title
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									onClick={() => onChange({ sortOrder: "asc" })}
								>
									Ascending
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onChange({ sortOrder: "desc" })}
								>
									Descending
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{availableTags.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{availableTags.map((tag) => (
						<Badge
							key={tag}
							asChild
							variant={filters.tags.includes(tag) ? "default" : "outline"}
							className="cursor-pointer rounded-lg px-3 py-1 transition-colors hover:bg-primary/10 hover:text-primary"
						>
							<button
								type="button"
								aria-pressed={filters.tags.includes(tag)}
								onClick={() => toggleTag(tag)}
							>
								{tag}
								{filters.tags.includes(tag) ? (
									<IconX className="ml-1.5 size-3" />
								) : null}
							</button>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}
