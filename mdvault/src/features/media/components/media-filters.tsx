import { IconSearch } from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";

interface MediaFiltersProps {
	imageTypes: string[];
	search: string;
	filter: string;
	onSearchChange: (value: string) => void;
	onFilterChange: (value: string) => void;
}

export function MediaFilters({
	imageTypes,
	search,
	filter,
	onSearchChange,
	onFilterChange,
}: MediaFiltersProps) {
	return (
		<div className="space-y-5 rounded-xl border bg-card/50 p-5">
			<div className="relative">
				<IconSearch className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Search assets by filename..."
					className="h-12 rounded-xl border-none bg-muted/40 pl-11"
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					Filter:
				</span>
				<Badge
					variant={filter === "all" ? "secondary" : "outline"}
					className="cursor-pointer rounded-lg px-4 py-2"
					onClick={() => onFilterChange("all")}
				>
					All
				</Badge>
				{imageTypes.map((type) => (
					<Badge
						key={type}
						variant={filter === type ? "secondary" : "outline"}
						className="cursor-pointer rounded-lg px-4 py-2 uppercase"
						onClick={() => onFilterChange(type)}
					>
						{type}
					</Badge>
				))}
			</div>
		</div>
	);
}
