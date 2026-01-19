"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface HeadingNode {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // This effect depends on pathname to re-scan headings when navigating between articles
    // Using pathname as a cache key
    const _currentPath = pathname;

    // Reset state when pathname changes
    setHeadings([]);
    setActiveId("");

    // Small delay to ensure the new content is rendered
    const timeoutId = setTimeout(() => {
      const headingElements = Array.from(
        document.querySelectorAll("article h1, article h2, article h3")
      ) as HTMLElement[];

      const headingNodes = headingElements.map((heading) => {
        if (!heading.id) {
          const id = heading.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9àâäéèêëïîôùûüÿœæç]+/g, "-")
            .replace(/^-|-$/g, "");
          if (id) heading.id = id;
        }

        return {
          id: heading.id || "",
          title: heading.textContent || "",
          level: parseInt(heading.tagName[1], 10),
        };
      });

      setHeadings(headingNodes);

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          }
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );

      for (const heading of headingElements) {
        observer.observe(heading);
      }

      return () => {
        for (const heading of headingElements) {
          observer.unobserve(heading);
        }
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Table of Contents
      </h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{
              marginLeft: `${(heading.level - 2) * 12}px`,
            }}
          >
            <a
              href={`#${heading.id}`}
              className={`inline-block transition-colors duration-200 ${
                activeId === heading.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
