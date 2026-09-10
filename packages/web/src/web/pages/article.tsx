import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Markdown } from "../components/markdown";
import { TableOfContents, useHeadings } from "../components/table-of-contents";
import { Tag } from "../components/blog-card";
import { usePost } from "../queries/posts";
import { formatDate } from "../lib/format";

export default function ArticlePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const query = usePost(slug);
  const post = query.data?.post;
  const headings = useHeadings(post?.content ?? "");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post?.title) document.title = `${post.title} — Lavish Pal`;
    return () => {
      document.title = "Lavish Pal — Platform Engineer · DevOps · SRE";
    };
  }, [slug, post?.title]);

  if (query.isLoading) {
    return (
      <div className="wrap article">
        <p className="blog-excerpt">Loading article…</p>
      </div>
    );
  }

  if (query.isError || !post) {
    return (
      <div className="wrap article">
        <header className="article-header">
          <h1>Article not found</h1>
          <p className="article-lede">This one may have been unpublished or renamed.</p>
        </header>
        <Link to="/blog" className="read-link">
          <ArrowLeft size={12} /> Back to the blog
        </Link>
      </div>
    );
  }

  const { previous, next } = query.data!;

  return (
    <div className="wrap article">
      <Link to="/blog" className="read-link">
        <ArrowLeft size={12} /> All articles
      </Link>

      <header className="article-header reveal">
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

        <h1>{post.title}</h1>
        {post.excerpt ? <p className="article-lede">{post.excerpt}</p> : null}

        {post.tags.length > 0 ? (
          <div className="chip-row">
            {post.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        ) : null}

        {post.coverImage ? <img className="article-cover" src={post.coverImage} alt="" /> : null}
      </header>

      <div className="article-layout">
        <div>
          <TableOfContents headings={headings} variant="inline" />
          <Markdown>{post.content}</Markdown>

          {post.canonicalUrl ? (
            <p className="blog-meta">
              <a href={post.canonicalUrl} target="_blank" rel="noopener noreferrer">
                Originally published on Hashnode <ExternalLink size={11} />
              </a>
            </p>
          ) : null}

          <nav className="article-nav">
            {previous ? (
              <Link to={`/blog/${previous.slug}`}>
                <span className="direction">
                  <ArrowLeft size={11} /> Previous
                </span>
                <span className="label">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/blog/${next.slug}`} className="next">
                <span className="direction">
                  Next <ArrowRight size={11} />
                </span>
                <span className="label">{next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
