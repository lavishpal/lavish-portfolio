import { useEffect, useMemo, useState } from "react";
import GithubSlugger from "github-slugger";

interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

/** Headings straight off the markdown source — ids match rehype-slug's. */
export function useHeadings(markdown: string): Heading[] {
  return useMemo(() => {
    const slugger = new GithubSlugger();
    const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");
    const found: Heading[] = [];
    for (const line of withoutCode.split("\n")) {
      const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
      if (!match) continue;
      const text = match[2]!.replace(/[*_`]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1");
      found.push({ depth: match[1]!.length as 2 | 3, text, id: slugger.slug(text) });
    }
    return found;
  }, [markdown]);
}

export function TableOfContents({
  headings,
  variant = "desktop",
}: {
  headings: Heading[];
  variant?: "desktop" | "inline";
}) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className={variant === "desktop" ? "toc toc-desktop" : "toc toc-inline"}>
      <div className="toc-label">On this page</div>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} data-depth={heading.depth}>
            <a href={`#${heading.id}`} data-active={active === heading.id ? "true" : "false"}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
