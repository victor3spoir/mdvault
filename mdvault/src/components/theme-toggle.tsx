import { IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const themeOrder = ["light", "dark", "system"] as const;

/**
 * The icon reflects the *selected* mode, not the resolved one, so "System"
 * stays distinguishable from an explicit Light or Dark choice.
 */
const themeIcons = {
	light: IconSun,
	dark: IconMoon,
	system: IconSunMoon,
} as const;

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
			aria-label={`Current theme: ${currentLabel}. Switch to ${nextLabel}.`}
			title={`Current theme: ${currentLabel}. Switch to ${nextLabel}.`}
			className="group relative size-9 overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-xs transition-colors duration-200 ease-out hover:bg-muted"
		>
			{themeOrder.map((mode) => {
				const Icon = themeIcons[mode];
				const isActive = currentTheme === mode;

				return (
					<Icon
						key={mode}
						aria-hidden="true"
						className={cn(
							"absolute z-10 size-4 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isActive
								? "scale-100 opacity-100 blur-0"
								: "scale-[0.25] opacity-0 blur-[4px]",
						)}
					/>
				);
			})}
			<span className="sr-only">{`Current theme: ${currentLabel}. Switch to ${nextLabel}.`}</span>
		</Button>
	);
}
