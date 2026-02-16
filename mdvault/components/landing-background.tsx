"use client";

export function LandingBackground() {
  return (
    <>
      {/* Light mode background */}
      <img
        src="/landing-bg.svg"
        alt="background"
        className="absolute inset-0 -z-10 w-full h-full object-cover dark:hidden"
      />
      {/* Dark mode background */}
      <img
        src="/landing-bg-dark.svg"
        alt="background dark"
        className="absolute inset-0 -z-10 w-full h-full object-cover hidden dark:block"
      />
    </>
  );
}
