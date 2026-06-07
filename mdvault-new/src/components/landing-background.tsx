"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LandingBackground() {
	const { theme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const currentTheme = theme === "system" ? systemTheme : theme;
	const backgroundImage =
		mounted && currentTheme === "dark"
			? "/landing-bg-dark.svg"
			: "/landing-bg.svg";

	return (
		<img
			src={backgroundImage}
			alt="background"
			className="absolute inset-0 -z-10 h-full w-full object-cover"
			suppressHydrationWarning
		/>
	);
}
