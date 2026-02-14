"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyToClipboardProps {
  value: string;
  className?: string;
}

export function CopyToClipboard({ value, className }: Readonly<CopyToClipboardProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8 h-8 w-8 hover:bg-primary/10 hover:text-primary", className)}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <IconCheck className="size-4 animate-in zoom-in" />
      ) : (
        <IconCopy className="size-4" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  );
}
