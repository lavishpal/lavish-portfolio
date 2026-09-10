import { useMemo, useState } from "react";
import { BlogList } from "../components/blog-card";
import { usePosts, usePostTags } from "../queries/posts";

/** Fixed topic rail — always visible, even before a topic has any posts. */
const CATEGORIES = [
  "Kubernetes",
  "Go",
  "DevOps",
  "SRE",
  "Open Source",
  "etcd",
  "CI/CD",
  "GitOps",
];

export default function BlogPage() {
  const [tag, setTag] = useState<string | null>(null);
  const posts = usePosts();
  const tags = usePostTags();

  const filters = useMemo(() => {
    const used = (tags.data ?? []).map((entry) => entry.tag);
    const extras = used.filter(
      (entry) => !CATEGORIES.some((category) => category.toLowerCase() === entry.toLowerCase()),
    );
    return [...CATEGORIES, ...extras];
  }, [tags.data]);

  const visible = useMemo(() => {
    const all = posts.data ?? [];
    if (!tag) return all;
    return all.filter((post) => post.tags.some((entry) => entry.toLowerCase() === tag.toLowerCase()));
  }, [posts.data, tag]);

  return (
    <div className="wrap">
      <header className="hero reveal">
        <div className="role">
          <span className="dot" />
          Field notes
        </div>
        <h1>Blog</h1>
        <p className="subline">Kubernetes, Go, and the plumbing underneath</p>
        <p className="bio">
          Long-form write-ups on the things I break, fix, and contribute to across the cloud native
          ecosystem — the API machinery, the release process, and the tooling around it.
        </p>
      </header>

      <section className="reveal" style={{ animationDelay: "0.1s" }}>
        <div className="eyebrow">Topics</div>
        <div className="chip-row">
          <button
            type="button"
            className="chip"
            data-active={tag === null ? "true" : "false"}
            onClick={() => setTag(null)}
          >
            All
          </button>
          {filters.map((entry) => (
            <button
              key={entry}
              type="button"
              className="chip"
              data-active={tag?.toLowerCase() === entry.toLowerCase() ? "true" : "false"}
              onClick={() => setTag(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </section>

      <section className="reveal" style={{ animationDelay: "0.15s" }}>
        <div className="eyebrow">
          Articles
          <span>{posts.isLoading ? "…" : `${visible.length}`}</span>
        </div>

        {posts.isLoading ? (
          <p className="blog-excerpt">Loading articles…</p>
        ) : posts.isError ? (
          <p className="blog-excerpt">Could not load articles. Refresh to try again.</p>
        ) : visible.length === 0 ? (
          <p className="blog-excerpt">
            Nothing filed under {tag ?? "this topic"} yet. Pick another topic.
          </p>
        ) : (
          <BlogList posts={visible} />
        )}
      </section>
    </div>
  );
}
