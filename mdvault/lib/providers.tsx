"use client";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, ViewTransition } from "react";

import { Toaster } from "sonner";
import { Suspense } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={null}>
        <NuqsAdapter>
          <ViewTransition>{children}</ViewTransition>
        </NuqsAdapter>
      </Suspense>
      <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          theme="system"
          // toastOptions={{
          //   style: {
          //     borderRadius: "0.5rem",
          //     background: "hsl(var(--background))",
          //     color: "hsl(var(--foreground))",
          //     border: "1px solid hsl(var(--border))",
          //   },
          //   className: "text-sm",
          // }}
        />
    </ThemeProvider>
  );
};

export default Providers;
