"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function LandingBackground() {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const backgroundImage = currentTheme === "dark" ? "/landing-bg-dark.svg" : "/landing-bg.svg";

  return (
    <img
      key={backgroundImage}
      src={backgroundImage}
      alt="background"
      className="absolute inset-0 -z-10 w-full h-full object-cover"
      style={{ pointerEvents: "none" }}
      suppressHydrationWarning
    />
  );
}
