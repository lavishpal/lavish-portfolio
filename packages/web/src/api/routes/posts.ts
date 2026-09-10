import { z } from "zod";
import { and, asc, desc, eq, gt, lt, ne } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { estimateReadingTime, slugify } from "../lib/posts";

const postInput = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(120).optional(),
  excerpt: z.string().max(600).default(""),
  content: z.string().default(""),
  coverImage: z.string().nullish(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  category: z.string().max(60).nullish(),
  readingTime: z.number().int().min(0).max(600).default(0),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.coerce.date().nullish(),
  canonicalUrl: z.string().max(400).nullish(),
});

/** Card/list shape — the markdown body is left out of listings. */
const listColumns = {
  id: schema.posts.id,
  slug: schema.posts.slug,
  title: schema.posts.title,
  excerpt: schema.posts.excerpt,
  coverImage: schema.posts.coverImage,
  tags: schema.posts.tags,
  category: schema.posts.category,
  readingTime: schema.posts.readingTime,
  status: schema.posts.status,
  publishedAt: schema.posts.publishedAt,
  updatedAt: schema.posts.updatedAt,
};

async function uniqueSlug(candidate: string, ignoreId?: number) {
  const bare = slugify(candidate) || `post-${Date.now()}`;
  let slug = bare;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const clash = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(
        ignoreId
          ? and(eq(schema.posts.slug, slug), ne(schema.posts.id, ignoreId))
          : eq(schema.posts.slug, slug),
      )
      .limit(1);
    if (clash.length === 0) return slug;
    slug = `${bare}-${attempt}`;
  }
  return `${bare}-${Date.now()}`;
}

function normalize(input: z.infer<typeof postInput>) {
  const publishedAt =
    input.status === "published" ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null);
  return {
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    coverImage: input.coverImage ?? null,
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    category: input.category?.trim() || null,
    readingTime: input.readingTime > 0 ? input.readingTime : estimateReadingTime(input.content),
    status: input.status,
    publishedAt,
    canonicalUrl: input.canonicalUrl?.trim() || null,
    updatedAt: new Date(),
  };
}

export const posts = {
  /** Published posts, newest first. Optional tag filter. */
  list: base
    .input(z.object({ tag: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }).optional())
    .handler(async ({ input }) => {
      const rows = await db
        .select(listColumns)
        .from(schema.posts)
        .where(eq(schema.posts.status, "published"))
        .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.id))
        .limit(input?.limit ?? 100);

      const filtered = input?.tag
        ? rows.filter((row) =>
            (row.tags ?? []).some((tag) => tag.toLowerCase() === input.tag!.toLowerCase()),
          )
        : rows;
      return filtered;
    }),

  /** Every tag in use, with counts, for the blog filter bar. */
  tags: base.handler(async () => {
    const rows = await db
      .select({ tags: schema.posts.tags })
      .from(schema.posts)
      .where(eq(schema.posts.status, "published"));
    const counts = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }),

  /** One published article plus previous/next navigation. */
  bySlug: base.input(z.object({ slug: z.string() })).handler(async ({ input }) => {
    const [post] = await db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.slug, input.slug), eq(schema.posts.status, "published")))
      .limit(1);
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Article not found" });

    const anchor = post.publishedAt ?? new Date(0);
    const [previous] = await db
      .select({ slug: schema.posts.slug, title: schema.posts.title })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, "published"), lt(schema.posts.publishedAt, anchor)))
      .orderBy(desc(schema.posts.publishedAt))
      .limit(1);
    const [next] = await db
      .select({ slug: schema.posts.slug, title: schema.posts.title })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, "published"), gt(schema.posts.publishedAt, anchor)))
      .orderBy(asc(schema.posts.publishedAt))
      .limit(1);

    return { post, previous: previous ?? null, next: next ?? null };
  }),

  /** Admin: every post, drafts included. */
  adminList: authed.handler(() =>
    db
      .select(listColumns)
      .from(schema.posts)
      .orderBy(desc(schema.posts.updatedAt))
      .limit(500),
  ),

  adminGet: authed.input(z.object({ id: z.number().int() })).handler(async ({ input }) => {
    const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, input.id)).limit(1);
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    return post;
  }),

  create: authed.input(postInput).handler(async ({ input }) => {
    const values = normalize(input);
    const slug = await uniqueSlug(input.slug || input.title);
    const [post] = await db
      .insert(schema.posts)
      .values({ ...values, slug, createdAt: new Date() })
      .returning();
    return post;
  }),

  update: authed
    .input(postInput.extend({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const values = normalize(rest);
      const slug = await uniqueSlug(input.slug || input.title, id);
      const [post] = await db
        .update(schema.posts)
        .set({ ...values, slug })
        .where(eq(schema.posts.id, id))
        .returning();
      if (!post) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
      return post;
    }),

  /** Publish / unpublish without opening the editor. */
  setStatus: authed
    .input(z.object({ id: z.number().int(), status: z.enum(["draft", "published"]) }))
    .handler(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.id, input.id))
        .limit(1);
      if (!existing) throw new ORPCError("NOT_FOUND", { message: "Post not found" });
      const [post] = await db
        .update(schema.posts)
        .set({
          status: input.status,
          publishedAt:
            input.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.posts.id, input.id))
        .returning();
      return post;
    }),

  remove: authed.input(z.object({ id: z.number().int() })).handler(async ({ input }) => {
    await db.delete(schema.posts).where(eq(schema.posts.id, input.id));
    return { ok: true };
  }),
};
