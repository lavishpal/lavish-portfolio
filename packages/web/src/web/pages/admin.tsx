import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { authClient, signOut } from "../lib/auth";
import { useAdminPosts, useDeletePost, useSetPostStatus } from "../queries/posts";
import { formatDate } from "../lib/format";

function AdminLogin() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Lavish Pal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Could not sign in");
  }

  return (
    <div className="wrap">
      <header className="hero reveal">
        <div className="role">
          <span className="dot" />
          Admin
        </div>
        <h1>Sign in</h1>
        <p className="subline">Blog dashboard · authorised accounts only</p>
      </header>

      <section className="reveal" style={{ animationDelay: "0.1s" }}>
        <form className="panel" onSubmit={submit} style={{ maxWidth: 420 }}>
          {mode === "sign-up" ? (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
              aria-label="Name" id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              aria-label="Email"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              aria-label="Password"
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          {error ? <span className="hint">{error}</span> : null}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? <Loader2 size={12} className="animate-spin" /> : null}
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            >
              {mode === "sign-in" ? "First time? Create the admin account" : "Back to sign in"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();
  const posts = useAdminPosts(!!session);
  const setStatus = useSetPostStatus();
  const remove = useDeletePost();
  const [pendingId, setPendingId] = useState<number | null>(null);

  if (isPending) {
    return (
      <div className="wrap">
        <p className="blog-excerpt">Checking session…</p>
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  const forbidden =
    posts.isError && (posts.error as { code?: string } | undefined)?.code === "FORBIDDEN";

  if (forbidden) {
    return (
      <div className="wrap">
        <header className="hero">
          <h1>Not authorised</h1>
          <p className="bio">
            <strong>{session.user.email}</strong> is not on the admin allowlist. Sign in with the
            site owner's account, or add this address to <code>ADMIN_EMAILS</code>.
          </p>
        </header>
        <button type="button" className="btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <header className="hero reveal">
        <div className="role">
          <span className="dot" />
          Admin · {session.user.email}
        </div>
        <h1>Blog dashboard</h1>
        <p className="subline">
          {posts.data ? `${posts.data.length} posts` : "Loading"} · everything on /blog comes from
          here
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link to="/admin/posts/new" className="btn primary">
            <Plus size={12} /> New post
          </Link>
          <Link to="/blog" className="btn">
            View blog
          </Link>
          <button type="button" className="btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <section className="reveal" style={{ animationDelay: "0.1s" }}>
        <div className="eyebrow">Posts</div>

        {posts.isLoading ? (
          <p className="blog-excerpt">Loading posts…</p>
        ) : posts.isError ? (
          <p className="blog-excerpt">Could not load posts.</p>
        ) : posts.data && posts.data.length > 0 ? (
          posts.data.map((post) => {
            const busy = pendingId === post.id;
            return (
              <div className="admin-row" key={post.id}>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/admin/posts/${post.id}`} className="blog-title">
                    {post.title}
                  </Link>
                  <div className="blog-meta">
                    <span className={`status-pill ${post.status}`}>{post.status}</span>
                    <span className="sep">/</span>
                    <span>{formatDate(post.publishedAt)}</span>
                    <span className="sep">/</span>
                    <span>{post.readingTime} min</span>
                    <span className="sep">/</span>
                    <span>/blog/{post.slug}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link to={`/admin/posts/${post.id}`} className="btn">
                    <PenLine size={12} /> Edit
                  </Link>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => {
                      setPendingId(post.id);
                      setStatus.mutate(
                        {
                          id: post.id,
                          status: post.status === "published" ? "draft" : "published",
                        },
                        { onSettled: () => setPendingId(null) },
                      );
                    }}
                  >
                    {post.status === "published" ? <EyeOff size={12} /> : <Eye size={12} />}
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
                      setPendingId(post.id);
                      remove.mutate({ id: post.id }, { onSettled: () => setPendingId(null) });
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="blog-excerpt">No posts yet. Start with “New post”.</p>
        )}
      </section>
    </div>
  );
}
