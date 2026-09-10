import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Markdown } from "./markdown";
import { usePresignUpload } from "../queries/posts";
import { toDateInput } from "../lib/format";

export interface PostDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  category: string | null;
  readingTime: number;
  status: "draft" | "published";
  publishedAt: Date | null;
  canonicalUrl: string | null;
}

export const CATEGORIES = [
  "Kubernetes",
  "Go",
  "DevOps",
  "SRE",
  "Open Source",
  "etcd",
  "CI/CD",
  "GitOps",
];

export function emptyDraft(): PostDraft {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: null,
    tags: [],
    category: null,
    readingTime: 0,
    status: "draft",
    publishedAt: null,
    canonicalUrl: null,
  };
}

export function BlogEditor({
  draft,
  onChange,
  onSave,
  saving,
  error,
}: {
  draft: PostDraft;
  onChange: (next: PostDraft) => void;
  onSave: (status: "draft" | "published") => void;
  saving: boolean;
  error?: string | null;
}) {
  const presign = usePresignUpload();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) =>
    onChange({ ...draft, [key]: value });

  async function uploadCover(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const target = await presign.mutateAsync({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      const response = await fetch(target.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
      set("coverImage", target.publicUrl);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="editor-grid">
      <div>
        <div className="panel">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              aria-label="Title"
              id="title"
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Demystify the kubeconfig file"
            />
          </div>

          <div className="field">
            <label htmlFor="slug">Slug</label>
            <input
              aria-label="Slug"
              id="slug"
              value={draft.slug}
              onChange={(event) => set("slug", event.target.value)}
              placeholder="left blank = generated from the title"
            />
          </div>

          <div className="field">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              aria-label="Excerpt"
              id="excerpt"
              value={draft.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              style={{ minHeight: 90 }}
              placeholder="One or two lines shown on the blog card."
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              aria-label="Category"
              id="category"
              value={draft.category ?? ""}
              onChange={(event) => set("category", event.target.value || null)}
            >
              <option value="">None</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="tags">Tags</label>
            <input
              aria-label="Tags"
              id="tags"
              value={draft.tags.join(", ")}
              onChange={(event) =>
                set(
                  "tags",
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Kubernetes, Go, SRE"
            />
            <span className="hint">Comma separated. These drive the blog filter rail.</span>
          </div>

          <div className="field">
            <label htmlFor="cover">Cover image</label>
            <input
              aria-label="Cover image URL"
              id="cover"
              value={draft.coverImage ?? ""}
              onChange={(event) => set("coverImage", event.target.value || null)}
              placeholder="/api/media/blog/… or an absolute URL"
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <label className="btn" htmlFor="cover-file">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? "Uploading…" : "Upload"}
              </label>
              <input
              aria-label="Upload cover image"
                id="cover-file"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadCover(file);
                  event.target.value = "";
                }}
              />
              {uploadError ? <span className="hint">{uploadError}</span> : null}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label htmlFor="reading">Reading time (min)</label>
              <input
              aria-label="Reading time in minutes"
                id="reading"
                type="number"
                min={0}
                value={draft.readingTime}
                onChange={(event) => set("readingTime", Number(event.target.value) || 0)}
              />
              <span className="hint">0 = derive from the body.</span>
            </div>

            <div className="field">
              <label htmlFor="published">Publish date</label>
              <input
              aria-label="Publish date"
                id="published"
                type="date"
                value={toDateInput(draft.publishedAt)}
                onChange={(event) =>
                  set("publishedAt", event.target.value ? new Date(event.target.value) : null)
                }
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="canonical">Canonical URL</label>
            <input
              aria-label="Canonical URL"
              id="canonical"
              value={draft.canonicalUrl ?? ""}
              onChange={(event) => set("canonicalUrl", event.target.value || null)}
              placeholder="https://lavishblog.hashnode.dev/…"
            />
          </div>

          <div className="field">
            <label htmlFor="content">Markdown</label>
            <textarea
              aria-label="Markdown body"
              id="content"
              value={draft.content}
              onChange={(event) => set("content", event.target.value)}
              placeholder={"## Heading\n\nBody text, ```go fenced code```, images, tables…"}
            />
          </div>

          {error ? <span className="hint">{error}</span> : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              disabled={saving || !draft.title.trim()}
              onClick={() => onSave("draft")}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              Save draft
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={saving || !draft.title.trim()}
              onClick={() => onSave("published")}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="preview-pane">
        <div className="eyebrow">Preview</div>
        <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: "12px 0 8px" }}>
          {draft.title || "Untitled"}
        </h1>
        {draft.excerpt ? <p className="article-lede">{draft.excerpt}</p> : null}
        {draft.coverImage ? <img className="article-cover" src={draft.coverImage} alt="" /> : null}
        <Markdown>{draft.content || "_Nothing written yet._"}</Markdown>
      </div>
    </div>
  );
}
