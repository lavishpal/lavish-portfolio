/**
 * Seeds (or refreshes) the three migrated Hashnode articles as in-house posts.
 * Run from the app root: `bun run scripts/seed-posts.ts`
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/api/database";
import { posts } from "../src/api/database/schema";

const contentDir = join(dirname(new URL(import.meta.url).pathname), "content");
const read = (slug: string) => readFileSync(join(contentDir, `${slug}.md`), "utf8");

const seed = [
  {
    slug: "lfx-mentorship-kubernetes",
    title: "LFX Mentorship Experience: Kubernetes",
    excerpt:
      "How I got into the LFX Mentorship program, contributed to Kubernetes, improved the reference docs generator, and grew as an open-source contributor.",
    coverImage: "/images/blog/lfx-mentorship-cover.png",
    tags: ["Open Source", "Kubernetes", "LFX", "Mentorship"],
    category: "Open Source",
    readingTime: 4,
    publishedAt: new Date("2025-12-03T00:00:00Z"),
    canonicalUrl: "https://lavishblog.hashnode.dev/lfx-mentorship-experience-kubernetes",
  },
  {
    slug: "accessing-everything-in-kubernetes-using-rest-api-calls",
    title: "Accessing everything in a Kubernetes cluster using REST API calls",
    excerpt:
      "Group, Version, Kind and Resource explained — then talking to the API server directly with service accounts, tokens and plain curl.",
    coverImage: "/images/blog/k8s-restapi-cover.png",
    tags: ["Kubernetes", "REST API", "Kubernetes Architecture", "Open Source"],
    category: "Kubernetes",
    readingTime: 8,
    publishedAt: new Date("2024-09-23T00:00:00Z"),
    canonicalUrl:
      "https://lavishblog.hashnode.dev/accessing-everything-in-kubernetes-cluster-using-restapi-calls",
  },
  {
    slug: "demystify-the-kubeconfig-file",
    title: "Demystify the kubeconfig file",
    excerpt:
      "What lives inside a kubeconfig, how clusters, users and contexts fit together, and how to mint a scoped user with certificates, Roles and RoleBindings.",
    coverImage: "/images/blog/kubeconfig-cover.png",
    tags: ["Kubernetes", "kubectl", "DevOps", "CNCF"],
    category: "Kubernetes",
    readingTime: 6,
    publishedAt: new Date("2024-07-12T00:00:00Z"),
    canonicalUrl: "https://lavishblog.hashnode.dev/demystify-the-kubeconfig-file",
  },
];

for (const item of seed) {
  const content = read(item.slug);
  const values = {
    ...item,
    content,
    status: "published" as const,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, item.slug))
    .limit(1);

  if (existing) {
    await db.update(posts).set(values).where(eq(posts.id, existing.id));
    console.log(`updated  ${item.slug}`);
  } else {
    await db.insert(posts).values({ ...values, createdAt: new Date() });
    console.log(`inserted ${item.slug}`);
  }
}

const all = await db.select({ slug: posts.slug, status: posts.status }).from(posts);
console.log(`\n${all.length} posts in the database:`);
for (const row of all) console.log(` - ${row.slug} (${row.status})`);
