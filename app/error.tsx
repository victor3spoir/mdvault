"use client";

import { IconAlertTriangle, IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
            <div className="relative rounded-full bg-destructive/10 p-6 border border-destructive/20">
              <IconAlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {error.message ||
              "An unexpected error occurred. Our team has been notified."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono bg-muted rounded p-3 break-all">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-col sm:flex-row pt-4">
          <Button onClick={reset} className="flex-1 gap-2" variant="default">
            <IconAlertTriangle className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <IconHome className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Support Link */}
        <p className="text-xs text-muted-foreground pt-4">
          If the problem persists,{" "}
          <a
            href="mailto:support@victorespoir.dev"
            className="text-foreground/70 hover:text-foreground underline transition-colors"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
