/**
 * Exports every row of the `posts` table to a portable JSON snapshot.
 *
 * Use it to move blog content between databases (agent sandbox → your own
 * Turso database, staging → production) without touching users or sessions.
 *
 *   cd packages/web
 *   bun --env-file=../../.env run scripts/export-posts.ts
 *
 * Writes to scripts/data/posts.json (override with a path argument).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { db } from "../src/api/database";
import { posts } from "../src/api/database/schema";

const scriptDir = dirname(new URL(import.meta.url).pathname);
const target = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : join(scriptDir, "data", "posts.json");

const rows = await db.select().from(posts);

const snapshot = {
  exportedAt: new Date().toISOString(),
  table: "posts",
  count: rows.length,
  posts: rows.map((row) => ({
    ...row,
    // Dates as ISO strings so the file stays human-readable and diffable.
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })),
};

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(`exported ${rows.length} posts → ${target}`);
for (const row of rows) console.log(` - ${row.slug} (${row.status})`);
