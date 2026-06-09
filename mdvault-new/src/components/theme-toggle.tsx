"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const themeOrder = ["light", "dark", "system"] as const;

function getNextTheme(theme: string | undefined) {
	const currentIndex = themeOrder.indexOf(
		theme === "light" || theme === "dark" || theme === "system"
			? theme
			: "system",
	);
	return themeOrder[(currentIndex + 1) % themeOrder.length];
}

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { setTheme, theme, systemTheme } = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	const activeTheme = useMemo(() => {
		if (!mounted) {
			return "light" as const;
		}

		if (theme === "system") {
			return systemTheme === "dark" ? "dark" : "light";
		}

		return theme === "dark" ? "dark" : "light";
	}, [mounted, systemTheme, theme]);

	const currentTheme = theme ?? "system";
	const nextTheme = getNextTheme(currentTheme);
	const currentLabel =
		currentTheme === "system"
			? `System (${activeTheme})`
			: currentTheme === "dark"
				? "Dark"
				: "Light";
	const nextLabel =
		nextTheme === "system" ? "System" : nextTheme === "dark" ? "Dark" : "Light";

	if (!mounted) {
		return null;
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			onClick={() => setTheme(nextTheme)}
			title={`Current theme: ${currentLabel}. Switch to ${nextLabel}.`}
			className={cn(
				"group relative h-10 w-10 overflow-hidden rounded-xl border border-border/80 text-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
				activeTheme === "dark"
					? "bg-muted/55 hover:bg-muted/75"
					: "bg-background/95 hover:bg-muted/65",
			)}
		>
			<span
				className={cn(
					"pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100",
					activeTheme === "dark"
						? "bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_12%,transparent_12%,transparent_24%),radial-gradient(circle_at_70%_28%,rgba(96,165,250,0.22),transparent_42%)]"
						: "bg-[linear-gradient(135deg,rgba(15,23,42,0.05)_0,rgba(15,23,42,0.05)_12%,transparent_12%,transparent_24%),radial-gradient(circle_at_70%_28%,rgba(56,189,248,0.14),transparent_42%)]",
				)}
			/>
			{activeTheme === "dark" ? (
				<IconMoon className="relative z-10 size-4" />
			) : (
				<IconSun className="relative z-10 size-4" />
			)}
			<span className="sr-only">{`Current theme: ${currentLabel}. Switch to ${nextLabel}.`}</span>
		</Button>
	);
}
