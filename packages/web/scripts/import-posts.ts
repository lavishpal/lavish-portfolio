/**
 * Imports a posts snapshot produced by scripts/export-posts.ts into whatever
 * database DATABASE_URL points at. Matching slugs are updated, new slugs are
 * inserted — nothing is deleted, so it is safe to re-run.
 *
 *   cd packages/web
 *   bun --env-file=../../.env run scripts/import-posts.ts [path/to/posts.json]
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/api/database";
import { posts } from "../src/api/database/schema";

interface SnapshotPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  category: string | null;
  readingTime: number;
  status: "draft" | "published";
  publishedAt: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const scriptDir = dirname(new URL(import.meta.url).pathname);
const source = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : join(scriptDir, "data", "posts.json");

const snapshot = JSON.parse(readFileSync(source, "utf8")) as { posts: SnapshotPost[] };

for (const post of snapshot.posts) {
  const values = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    tags: post.tags,
    category: post.category,
    readingTime: post.readingTime,
    status: post.status,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    canonicalUrl: post.canonicalUrl,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, post.slug))
    .limit(1);

  if (existing) {
    await db.update(posts).set(values).where(eq(posts.id, existing.id));
    console.log(`updated  ${post.slug}`);
  } else {
    await db.insert(posts).values({ ...values, createdAt: new Date(post.createdAt) });
    console.log(`inserted ${post.slug}`);
  }
}

const all = await db.select({ slug: posts.slug, status: posts.status }).from(posts);
console.log(`\n${all.length} posts in the database:`);
for (const row of all) console.log(` - ${row.slug} (${row.status})`);
