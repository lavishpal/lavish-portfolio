import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Blog posts. Written and managed from /admin — nothing about the blog is
 * hardcoded in the frontend.
 */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  /** Markdown body. */
  content: text("content").notNull().default(""),
  /** Storage key (served through /api/media/<key>) or an absolute URL. */
  coverImage: text("cover_image"),
  /** JSON array of tag strings. */
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  category: text("category"),
  /** Minutes. 0 = derive from content length. */
  readingTime: integer("reading_time").notNull().default(0),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  /** Optional link to the original/syndicated version of the article. */
  canonicalUrl: text("canonical_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Post = typeof posts.$inferSelect;

export * from "./auth-schema";
