"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { Button } from "./button";

interface CodeBlockProps {
  children: string;
  language: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const normalizedLang = normalizeLanguage(language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="group relative my-4">
      <SyntaxHighlighter
        language={normalizedLang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.625",
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Button
          onClick={handleCopy}
          className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <IconCheck size={16} className="text-green-500" />
          ) : (
            <IconCopy size={16} />
          )}
        </Button>
        {language !== "text" && (
          <div className="px-2 py-1 rounded text-xs font-mono bg-zinc-800 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
            {language}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    py: "python",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    dockerfile: "docker",
    tf: "hcl",
    terraform: "hcl",
    md: "markdown",
    mdx: "markdown",
    "c++": "cpp",
    cs: "csharp",
    rb: "ruby",
    rs: "rust",
    kt: "kotlin",
    gql: "graphql",
  };

  const normalized = lang.toLowerCase();
  return aliases[normalized] || normalized;
}
