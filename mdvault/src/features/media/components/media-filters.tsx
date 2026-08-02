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
		<div className="flex flex-col gap-4">
			<div className="relative">
				<IconSearch className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Search assets by filename..."
					aria-label="Search assets"
					className="h-11 rounded-2xl border-none bg-muted/50 pr-4 pl-11 focus-visible:ring-1 focus-visible:ring-primary/20"
				/>
			</div>

			{imageTypes.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					<Badge
						asChild
						variant={filter === "all" ? "default" : "outline"}
						className="cursor-pointer rounded-lg px-3 py-1 transition-colors hover:bg-primary/10 hover:text-primary"
					>
						<button
							type="button"
							aria-pressed={filter === "all"}
							onClick={() => onFilterChange("all")}
						>
							All
						</button>
					</Badge>
					{imageTypes.map((type) => (
						<Badge
							key={type}
							asChild
							variant={filter === type ? "default" : "outline"}
							className="cursor-pointer rounded-lg px-3 py-1 uppercase transition-colors hover:bg-primary/10 hover:text-primary"
						>
							<button
								type="button"
								aria-pressed={filter === type}
								onClick={() => onFilterChange(type)}
							>
								{type}
							</button>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}
