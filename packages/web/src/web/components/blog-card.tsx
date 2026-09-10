import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { formatDate } from "../lib/format";

export interface PostCard {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  category: string | null;
  readingTime: number;
  publishedAt: Date | string | null;
}

export function Tag({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  if (!onClick) return <span className="chip">{label}</span>;
  return (
    <button type="button" className="chip" data-active={active ? "true" : "false"} onClick={onClick}>
      {label}
    </button>
  );
}

export function BlogCard({ post }: { post: PostCard }) {
  const href = `/blog/${post.slug}`;
  return (
    <li className="blog-card">
      <Link to={href} aria-label={post.title}>
        {post.coverImage ? (
          <img className="cover" src={post.coverImage} alt="" loading="lazy" />
        ) : (
          <span className="cover cover-fallback">{post.category ?? "Article"}</span>
        )}
      </Link>

      <div>
        <Link to={href} className="blog-title">
          {post.title}
        </Link>

        <div className="blog-meta">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="sep">/</span>
          <span>{post.readingTime} min read</span>
          {post.category ? (
            <>
              <span className="sep">/</span>
              <span>{post.category}</span>
            </>
          ) : null}
        </div>

        <p className="blog-excerpt">{post.excerpt}</p>

        {post.tags.length > 0 ? (
          <div className="chip-row">
            {post.tags.slice(0, 4).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        ) : null}

        <Link to={href} className="read-link">
          Read article <ArrowRight size={12} />
        </Link>
      </div>
    </li>
  );
}

export function BlogList({ posts }: { posts: PostCard[] }) {
  return (
    <ul className="blog-list">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </ul>
  );
}
