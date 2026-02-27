"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import lightBg from "@/public/landing-bg.svg";
import darkBg from "@/public/landing-bg-dark.svg";

export function LandingBackground() {
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const backgroundImage = currentTheme === "dark" ? darkBg : lightBg;

  return (
    <Image
      key={backgroundImage}
      src={backgroundImage}
      height={100}
      width={100}
      alt="background"
      className="absolute inset-0 -z-10 w-full h-full object-cover"
      // style={{ pointerEvents: "none" }}
      suppressHydrationWarning
    />
  );
}
