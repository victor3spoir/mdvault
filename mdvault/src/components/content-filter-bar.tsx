import {
	IconChevronDown,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
	IconTag,
	IconWorld,
	IconX,
} from "@tabler/icons-react";
import { LocaleFlag } from "#/components/locale-flag";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	type ContentFilters,
	hasActiveContentFilters,
} from "#/features/shared/content-filters";
import { getLocaleLabel } from "#/features/shared/locales";
import { cn } from "#/lib/utils";

interface ContentFilterBarProps {
	filters: ContentFilters;
	onChange: (patch: Partial<ContentFilters>) => void;
	/** Content noun used in placeholders and aria labels, e.g. "articles". */
	label: string;
	availableTags?: string[];
	locales: readonly string[];
	/** Resets every filter at once; enables the "Clear all" affordance. */
	onClear?: () => void;
}

const STATUS_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "published", label: "Published" },
	{ value: "draft", label: "Drafts" },
] as const;

const SORT_LABELS: Record<ContentFilters["sortBy"], string> = {
	date: "Date",
	title: "Title",
};

/**
 * Shared shape for every control in the toolbar row, so the search field and
 * the trailing controls read as one unit instead of mismatched pills.
 */
const CONTROL =
	"h-11 rounded-2xl border-none bg-muted/50 text-sm font-normal transition-colors hover:bg-muted";

export function ContentFilterBar({
	filters,
	onChange,
	label,
	availableTags = [],
	locales,
	onClear,
}: ContentFilterBarProps) {
	const toggleTag = (tag: string) => {
		const nextTags = filters.tags.includes(tag)
			? filters.tags.filter((value) => value !== tag)
			: [...filters.tags, tag];
		onChange({ tags: nextTags });
	};

	const isActive = hasActiveContentFilters(filters);
	const SortIcon =
		filters.sortOrder === "asc" ? IconSortAscending : IconSortDescending;

	return (
		<div className="@container/filters flex flex-col gap-3">
			<div className="flex flex-col gap-2 @3xl/filters:flex-row @3xl/filters:items-center">
				<SearchField
					label={label}
					value={filters.searchQuery}
					onChange={(searchQuery) => onChange({ searchQuery })}
				/>

				<div className="flex flex-wrap items-center gap-2">
					<StatusSegmentedControl
						label={label}
						value={filters.status}
						onChange={(status) => onChange({ status })}
					/>

					{locales.length > 1 ? (
						<LanguageMenu
							label={label}
							value={filters.lang}
							locales={locales}
							onChange={(lang) => onChange({ lang })}
						/>
					) : null}

					{availableTags.length > 0 ? (
						<TagsMenu
							label={label}
							availableTags={availableTags}
							selected={filters.tags}
							onToggle={toggleTag}
							onClear={() => onChange({ tags: [] })}
						/>
					) : null}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								aria-label={`Sort ${label} by ${SORT_LABELS[filters.sortBy].toLowerCase()}, ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
								className={cn(CONTROL, "gap-2 px-3.5")}
							>
								<SortIcon className="size-4.5 text-muted-foreground" />
								<span className="hidden @sm/filters:inline">
									{SORT_LABELS[filters.sortBy]}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44 rounded-2xl">
							<DropdownMenuLabel>Sort by</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={filters.sortBy}
								onValueChange={(value) =>
									onChange({ sortBy: value as ContentFilters["sortBy"] })
								}
							>
								<DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="title">
									Title
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Order</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={filters.sortOrder}
								onValueChange={(value) =>
									onChange({ sortOrder: value as ContentFilters["sortOrder"] })
								}
							>
								<DropdownMenuRadioItem value="desc">
									Descending
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="asc">
									Ascending
								</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{isActive ? (
				<ActiveFilters
					filters={filters}
					onChange={onChange}
					onRemoveTag={toggleTag}
					onClear={onClear}
				/>
			) : null}
		</div>
	);
}

function SearchField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="relative flex-1">
			<IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={`Search ${label}...`}
				aria-label={`Search ${label}`}
				className="h-11 rounded-2xl border-none bg-muted/50 pr-11 pl-11 transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-primary/25"
			/>
			{value ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Clear search"
					onClick={() => onChange("")}
					className="absolute top-1/2 right-2 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
				>
					<IconX className="size-4" />
				</Button>
			) : null}
		</div>
	);
}

/**
 * Status is a small, mutually exclusive set, so it earns a segmented control:
 * every option is visible and one click away instead of hidden behind a select.
 */
function StatusSegmentedControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: ContentFilters["status"];
	onChange: (value: ContentFilters["status"]) => void;
}) {
	return (
		<fieldset className="flex h-11 items-center gap-0.5 rounded-2xl bg-muted/50 p-1">
			<legend className="sr-only">{`Filter ${label} by status`}</legend>
			{STATUS_OPTIONS.map((option) => {
				const selected = value === option.value;

				return (
					<label
						key={option.value}
						className={cn(
							"flex h-9 cursor-pointer items-center rounded-xl px-3.5 text-sm font-medium transition-colors",
							"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30",
							selected
								? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<input
							type="radio"
							className="sr-only"
							name={`status-filter-${label}`}
							value={option.value}
							checked={selected}
							onChange={() => onChange(option.value)}
						/>
						{option.label}
					</label>
				);
			})}
		</fieldset>
	);
}

function LanguageMenu({
	label,
	value,
	locales,
	onChange,
}: {
	label: string;
	value: ContentFilters["lang"];
	locales: readonly string[];
	onChange: (value: ContentFilters["lang"]) => void;
}) {
	const selected = value !== "all";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					aria-label={`Filter ${label} by language`}
					className={cn(CONTROL, "gap-2 px-3.5")}
				>
					{selected ? (
						<LocaleFlag locale={value} />
					) : (
						<IconWorld className="size-4.5 text-muted-foreground" />
					)}
					<span className="hidden @sm/filters:inline">
						{selected ? getLocaleLabel(value) : "Language"}
					</span>
					<IconChevronDown className="size-4 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52 rounded-2xl">
				<DropdownMenuLabel>Language</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(next) => onChange(next as ContentFilters["lang"])}
				>
					<DropdownMenuRadioItem value="all">
						All languages
					</DropdownMenuRadioItem>
					{locales.map((locale) => (
						<DropdownMenuRadioItem key={locale} value={locale}>
							<LocaleFlag locale={locale} />
							{getLocaleLabel(locale)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Tags used to be a wall of pills under the toolbar. They now live one level
 * deeper; the ones actually in use resurface as removable chips.
 */
function TagsMenu({
	label,
	availableTags,
	selected,
	onToggle,
	onClear,
}: {
	label: string;
	availableTags: string[];
	selected: string[];
	onToggle: (tag: string) => void;
	onClear: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					aria-label={`Filter ${label} by tag`}
					className={cn(CONTROL, "gap-2 px-3.5")}
				>
					<IconTag className="size-4.5 text-muted-foreground" />
					<span className="hidden @sm/filters:inline">Tags</span>
					{selected.length > 0 ? (
						<Badge className="size-5 rounded-full p-0 text-[11px] tabular-nums">
							{selected.length}
						</Badge>
					) : (
						<IconChevronDown className="size-4 text-muted-foreground" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="max-h-80 w-56 overflow-y-auto rounded-2xl"
			>
				<DropdownMenuLabel className="flex items-center justify-between gap-2">
					Tags
					{selected.length > 0 ? (
						<button
							type="button"
							onClick={onClear}
							className="text-xs font-normal text-muted-foreground hover:text-foreground"
						>
							Clear
						</button>
					) : null}
				</DropdownMenuLabel>
				<DropdownMenuGroup>
					{availableTags.map((tag) => (
						<DropdownMenuCheckboxItem
							key={tag}
							checked={selected.includes(tag)}
							onSelect={(event) => event.preventDefault()}
							onCheckedChange={() => onToggle(tag)}
						>
							{tag}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Makes the current query legible and reversible one condition at a time. */
function ActiveFilters({
	filters,
	onChange,
	onRemoveTag,
	onClear,
}: {
	filters: ContentFilters;
	onChange: (patch: Partial<ContentFilters>) => void;
	onRemoveTag: (tag: string) => void;
	onClear?: () => void;
}) {
	const query = filters.searchQuery.trim();

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-xs font-medium text-muted-foreground">
				Filtering by
			</span>

			{query ? (
				<FilterChip
					label={`“${query}”`}
					onRemove={() => onChange({ searchQuery: "" })}
				/>
			) : null}

			{filters.status !== "all" ? (
				<FilterChip
					label={filters.status === "published" ? "Published" : "Drafts"}
					onRemove={() => onChange({ status: "all" })}
				/>
			) : null}

			{filters.lang !== "all" ? (
				<FilterChip
					label={getLocaleLabel(filters.lang)}
					icon={<LocaleFlag locale={filters.lang} />}
					onRemove={() => onChange({ lang: "all" })}
				/>
			) : null}

			{filters.tags.map((tag) => (
				<FilterChip key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
			))}

			{onClear ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClear}
					className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
				>
					Clear all
				</Button>
			) : null}
		</div>
	);
}

function FilterChip({
	label,
	icon,
	onRemove,
}: {
	label: string;
	icon?: React.ReactNode;
	onRemove: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onRemove}
			aria-label={`Remove filter ${label}`}
			className="group inline-flex h-7 items-center gap-1.5 rounded-full bg-muted/70 pr-1.5 pl-2.5 text-xs font-medium transition-colors hover:bg-muted"
		>
			{icon}
			<span className="max-w-40 truncate">{label}</span>
			<IconX className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
		</button>
	);
}
