import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { authClient } from "../lib/auth";
import { BlogEditor, emptyDraft, type PostDraft } from "../components/blog-editor";
import { useAdminPost, useCreatePost, useUpdatePost } from "../queries/posts";

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  return "Could not save the post";
}

export default function AdminEditorPage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { data: session, isPending } = authClient.useSession();

  const id = params.id && params.id !== "new" ? Number(params.id) : null;
  const existing = useAdminPost(id ?? 0, !!session && id !== null);

  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCreatePost();
  const update = useUpdatePost();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (id === null || loaded || !existing.data) return;
    const post = existing.data;
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      coverImage: post.coverImage ?? null,
      tags: post.tags ?? [],
      category: post.category ?? null,
      readingTime: post.readingTime ?? 0,
      status: post.status,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      canonicalUrl: post.canonicalUrl ?? null,
    });
    setLoaded(true);
  }, [existing.data, id, loaded]);

  async function save(status: "draft" | "published") {
    setError(null);
    const payload = {
      title: draft.title,
      slug: draft.slug || undefined,
      excerpt: draft.excerpt,
      content: draft.content,
      coverImage: draft.coverImage,
      tags: draft.tags,
      category: draft.category,
      readingTime: draft.readingTime,
      status,
      publishedAt: draft.publishedAt,
      canonicalUrl: draft.canonicalUrl,
    };
    try {
      if (id === null) {
        const post = await create.mutateAsync(payload);
        navigate(`/admin/posts/${post!.id}`);
      } else {
        const post = await update.mutateAsync({ ...payload, id });
        setDraft((current) => ({ ...current, slug: post!.slug, status: post!.status }));
      }
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  if (isPending) {
    return (
      <div className="wrap">
        <p className="blog-excerpt">Checking session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="wrap">
        <header className="hero">
          <h1>Sign in required</h1>
          <p className="bio">The editor is only available to signed-in admins.</p>
        </header>
        <Link to="/admin" className="btn primary">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (id !== null && existing.isLoading) {
    return (
      <div className="wrap">
        <p className="blog-excerpt">Loading post…</p>
      </div>
    );
  }

  if (id !== null && existing.isError) {
    return (
      <div className="wrap">
        <header className="hero">
          <h1>Post unavailable</h1>
          <p className="bio">
            Either this post does not exist, or this account is not on the admin allowlist.
          </p>
        </header>
        <Link to="/admin" className="btn">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 1180 }}>
      <header className="hero reveal">
        <div className="role">
          <span className="dot" />
          Admin
        </div>
        <h1>{id === null ? "New post" : "Edit post"}</h1>
        <p className="subline">
          Markdown on the left, live preview on the right
          {draft.slug ? ` · /blog/${draft.slug}` : ""}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link to="/admin" className="btn">
            <ArrowLeft size={12} /> Dashboard
          </Link>
          {draft.slug && draft.status === "published" ? (
            <Link to={`/blog/${draft.slug}`} className="btn">
              View article
            </Link>
          ) : null}
          <span className={`status-pill ${draft.status}`}>{draft.status}</span>
        </div>
      </header>

      <section className="reveal" style={{ animationDelay: "0.1s" }}>
        <BlogEditor
          draft={draft}
          onChange={setDraft}
          onSave={(status) => void save(status)}
          saving={saving}
          error={error}
        />
      </section>
    </div>
  );
}
