"use client";

import Image from "next/image";

export function LandingBackground() {
  return (
    <>
      {/* Light mode background */}
      <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
        <Image
          src="/landing-bg.svg"
          alt="background"
          fill
          priority
          unoptimized
          className="object-cover dark:hidden"
          sizes="100vw"
        />
      </div>
      {/* Dark mode background */}
      <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
        <Image
          src="/landing-bg-dark.svg"
          alt="background dark"
          fill
          priority
          unoptimized
          className="hidden object-cover dark:block"
          sizes="100vw"
        />
      </div>
    </>
  );
}
