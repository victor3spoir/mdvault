"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LandingBackground() {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;
  const bgImage =
    currentTheme === "dark" ? "/landing-bg-dark.svg" : "/landing-bg.svg";

  return (
    <div className="absolute inset-0 -z-10 w-full h-full">
      <Image
        src={bgImage}
        alt="background"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}
