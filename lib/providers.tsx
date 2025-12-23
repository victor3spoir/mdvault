"use client";
import { type ReactNode, ViewTransition } from "react";
import { ToastProvider } from "@/components/providers/toast-provider";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ViewTransition>
      {children}
      <ToastProvider />
    </ViewTransition>
  );
};

export default Providers;
