import Image from "next/image";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/ui/code-block";

function InlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}

function CustomLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (href?.startsWith("/") || href?.startsWith("#")) {
    return (
      <a href={href} className="text-primary hover:underline">
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
}

function CustomImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;

  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  if (isExternal) {
    return (
      <Image
        src={src}
        alt={alt || ""}
        width={800}
        height={450}
        className="rounded-lg my-6 w-full h-auto"
        unoptimized
      />
    );
  }

  return (
    <div
      className="relative w-full my-6 rounded-lg overflow-hidden bg-muted"
      style={{ aspectRatio: "16/9" }}
    >
      <Image
        src={src}
        alt={alt || ""}
        fill
        className="object-contain p-4"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 85vw"
      />
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mt-10 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold mt-8 mb-3 pb-2 border-b border-border">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-7 text-foreground/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => <CustomLink href={href}>{children}</CustomLink>,
  pre: ({ children }) => <>{children}</>,
  code: ({ children, className }) => {
    // Inline code (no language class)
    if (!className) {
      return <InlineCode>{children}</InlineCode>;
    }
    // Block code with syntax highlighting
    const lang = className.replace("language-", "") || "text";
    const code = typeof children === "string" ? children.trim() : String(children || "").trim();
    return <CodeBlock language={lang}>{code}</CodeBlock>;
  },
  img: ({ src, alt }) => <CustomImage src={typeof src === "string" ? src : undefined} alt={alt} />,
  hr: () => <hr className="my-8 border-border" />,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-border">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold bg-muted">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 border-t border-border">{children}</td>
  ),
};

export function MDXContent({ source }: { source: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </Markdown>
  );
}
