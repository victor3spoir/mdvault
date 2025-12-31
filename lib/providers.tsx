"use client";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, ViewTransition } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <ViewTransition>
        <NuqsAdapter>{children}</NuqsAdapter>
        <ToastProvider />
      </ViewTransition>
    </ThemeProvider>
  );
};

export default Providers;
