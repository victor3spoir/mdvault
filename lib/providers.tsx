"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, ViewTransition } from "react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "sonner";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >

      <ViewTransition>
        <NuqsAdapter>{children}</NuqsAdapter>
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
      </ViewTransition>
    </ThemeProvider>
  );
};

export default Providers;
