"use client";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, ViewTransition } from "react";
import { ToastProvider } from "@/components/providers/toast-provider";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ViewTransition>
      <NuqsAdapter>
      {children}
      </NuqsAdapter>
      <ToastProvider />
    </ViewTransition>
  );
};

export default Providers;
