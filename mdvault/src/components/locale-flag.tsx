import { IconWorld } from "@tabler/icons-react";
import { hasFlag } from "country-flag-icons";
import { getLocaleLabel, getLocaleRegion } from "#/features/shared/locales";
import { cn } from "#/lib/utils";

interface LocaleFlagProps {
	locale: string;
	className?: string;
}

/**
 * Small 3x2 flag accent for a content locale. Decorative only: every call site
 * keeps its textual label or code so meaning never depends on the flag alone.
 */
export function LocaleFlag({ locale, className }: LocaleFlagProps) {
	const region = getLocaleRegion(locale);

	if (!region || !hasFlag(region)) {
		return (
			<IconWorld
				aria-hidden
				className={cn("size-3 shrink-0 text-muted-foreground", className)}
			/>
		);
	}

	return (
		<img
			src={`/flags/${region}.svg`}
			alt=""
			aria-hidden
			loading="lazy"
			decoding="async"
			title={getLocaleLabel(locale)}
			className={cn(
				"h-3 w-[18px] shrink-0 rounded-[2px] object-cover ring-1 ring-black/10 dark:ring-white/15",
				className,
			)}
		/>
	);
}
