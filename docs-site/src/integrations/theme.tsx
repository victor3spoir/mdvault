import { IconDeviceLaptop, IconMoon, IconSun } from "@tabler/icons-react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

/**
 * Theme plumbing for the whole app.
 *
 * `next-themes` writes the `class` on <html> before paint (inline script), so
 * there is no flash of the wrong theme on first render. The document element
 * carries `suppressHydrationWarning` in `__root.tsx` because that class is
 * added on the client only.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</NextThemesProvider>
	);
}

const OPTIONS = [
	{ value: "light", label: "Light", icon: IconSun },
	{ value: "dark", label: "Dark", icon: IconMoon },
	{ value: "system", label: "System", icon: IconDeviceLaptop },
] as const;

/**
 * Light / dark / system switcher.
 *
 * Renders both icons and swaps them with CSS (`dark:`) instead of reading the
 * resolved theme during render, so the markup is identical on the server and on
 * the client — no hydration mismatch, no `mounted` flag.
 */
export function ThemeToggle({
	className,
	size = "icon",
}: {
	className?: string;
	size?: "icon" | "sm";
}) {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size={size === "icon" ? "icon" : "sm"}
					className={className}
					aria-label="Change theme"
				>
					<IconSun className="size-4 dark:hidden" />
					<IconMoon className="hidden size-4 dark:block" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-36">
				{OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onSelect={() => setTheme(option.value)}
					>
						<option.icon className="size-4" />
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
