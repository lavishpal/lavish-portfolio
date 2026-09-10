# Migration, database, and deployment guide

Everything you need to run this project outside the agent sandbox it was built in.

---

## 1. Database provider

**Turso (libSQL)**, accessed with `@libsql/client` through **Drizzle ORM**.

- Connection: `DATABASE_URL` + `DATABASE_AUTH_TOKEN`
- Dialect config: `packages/web/drizzle.config.ts` (`dialect: "turso"`)
- Client: `packages/web/src/api/database/__client.ts`
- Schema: `packages/web/src/api/database/schema.ts` and `auth-schema.ts`

The database used while building this app is a Turso database provisioned by the Runable sandbox.
Its credentials live only in the sandbox `.env` (never committed). You have two options:

- **Keep using it** — copy `DATABASE_URL` and `DATABASE_AUTH_TOKEN` out of the sandbox `.env`
  (Runable app → environment variables) into your own `.env`. Same database, same posts, nothing
  to re-seed. This is the "connect the GitHub project to the same production database" path.
- **Use your own Turso database** — create one, apply migrations, then import the posts snapshot
  (section 4). Takes about two minutes and costs nothing on Turso's free tier.

```bash
# your own database, if you go that route
turso db create lavish-portfolio
turso db show lavish-portfolio --url          # → DATABASE_URL
turso db tokens create lavish-portfolio       # → DATABASE_AUTH_TOKEN
```

A local file database also works for development: `DATABASE_URL=file:./local.db` with an empty
`DATABASE_AUTH_TOKEN`.

---

## 2. Required tables

Five tables, all defined in `packages/web/src/api/database/schema.ts` (which re-exports
`auth-schema.ts`):

| Table          | Owner       | Purpose                                                                 |
| -------------- | ----------- | ----------------------------------------------------------------------- |
| `posts`        | app         | Blog posts: slug, title, excerpt, markdown `content`, `cover_image`, `tags` (JSON), `category`, `reading_time`, `status` (`draft`/`published`), `published_at`, `canonical_url`, timestamps |
| `user`         | Better Auth | Admin accounts (email, name, `email_verified`, image, timestamps)        |
| `account`      | Better Auth | Credentials per user — the password hash lives here                     |
| `session`      | Better Auth | Active sessions and bearer tokens                                       |
| `verification` | Better Auth | Verification tokens                                                     |

`posts.slug` is unique. Nothing about the blog is hardcoded in the frontend — the listing, post
pages, and topic rail all read from `posts`.

---

## 3. Applying migrations

Versioned SQL migrations are committed at `packages/web/drizzle/` (`0000_init.sql` +
`meta/_journal.json`).

**Fresh database:**

```bash
cd packages/web
bun run db:migrate      # applies packages/web/drizzle/*.sql to DATABASE_URL
```

**Database that already has these tables** (for example the sandbox database you carry over): it
is already in sync — skip `db:migrate`, since re-applying `0000_init.sql` would fail on existing
tables. To verify the schema matches without writing migrations, run:

```bash
cd packages/web
bun run db:push         # diffs the schema and syncs; prints "No changes detected" when in sync
```

**After changing `schema.ts`:**

```bash
cd packages/web
bun run db:generate     # writes the next drizzle/NNNN_*.sql
bun run db:migrate      # applies it
```

All three commands read the root `.env` via `bun --env-file=../../.env`.

---

## 4. Moving the existing blog data

Two independent, committed sources of truth for the content — you do not need the sandbox database
to get the posts back.

**a) Markdown seed (canonical).** The three migrated articles live as Markdown at
`packages/web/scripts/content/*.md`, with their metadata (title, excerpt, tags, category, reading
time, published date, canonical Hashnode URL) in `packages/web/scripts/seed-posts.ts`.

```bash
cd packages/web
bun run db:seed         # inserts missing slugs, updates existing ones — safe to re-run
```

**b) JSON snapshot (exact row copy).** `packages/web/scripts/data/posts.json` is a dump of the
live `posts` table taken from the working application, including generated timestamps.

```bash
cd packages/web
bun run db:export       # re-dump the current database → scripts/data/posts.json
bun run db:import       # load a snapshot into DATABASE_URL (upsert by slug, deletes nothing)
```

Neither script touches `user`, `account`, or `session`, so content moves without moving credentials.

---

## 5. How the three Hashnode posts are preserved

| Slug                                                     | Title                                                          | Canonical source |
| -------------------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| `lfx-mentorship-kubernetes`                              | LFX Mentorship Experience: Kubernetes                          | hashnode         |
| `accessing-everything-in-kubernetes-using-rest-api-calls`| Accessing everything in a Kubernetes cluster using REST API calls | hashnode      |
| `demystify-the-kubeconfig-file`                          | Demystify the kubeconfig file                                  | hashnode         |

Each one is a real row in `posts` with `status = "published"`, its original publish date, tags,
category, and a `canonical_url` pointing back at the Hashnode original (good for SEO — it tells
search engines which copy is authoritative).

Their bodies were converted from the published HTML to Markdown, headings were demoted one level so
each page has a single `h1`, and bare code fences were tagged with a language (`bash`, `yaml`,
`json`) so syntax highlighting works. All inline images were downloaded off the Hashnode CDN into
`packages/web/public/images/blog/` and rewritten to local paths, so the posts no longer depend on
Hashnode being up.

Both the Markdown and the JSON snapshot are committed, so the content survives any database
change.

---

## 6. Where uploaded images live

Two distinct paths:

**Migrated article images — repository assets.** `packages/web/public/images/blog/*.png`
(12 files: `k8s-restapi-1…6` + cover, `kubeconfig-1` + cover, `lfx-mentorship-1…3` + cover).
Served statically at `/images/blog/…`, optimized at build time. Committed to git.

**Admin uploads — S3-compatible object storage.** When you upload a cover image in the admin
editor:

1. The client asks `upload.presign` (admin-only) for a presigned `PUT`.
2. `packages/web/src/api/routes/upload.ts` returns a URL for the key `blog/<timestamp>-<name>.<ext>`.
3. The browser uploads straight to the bucket — bytes never pass through the API.
4. The stored `posts.cover_image` value is `/api/media/blog/<timestamp>-<name>.<ext>`.
5. `GET /api/media/*` (in `packages/web/src/api/index.ts`) redirects to a 1-hour presigned `GET`,
   so the bucket itself stays private.

Configure with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Cloudflare
R2, AWS S3, and Backblaze B2 all work. If you switch buckets, existing `/api/media/...` cover
images stop resolving until you copy the old objects across — or just re-upload those covers from
`/admin`. The 12 migrated images are unaffected: they are repo files, not bucket objects.

---

## 7. Authentication and the admin allowlist

- Better Auth, email + password only (`packages/web/src/api/auth.ts`). No OAuth provider to
  configure.
- The session rides on a bearer token stored in `localStorage` under `lavish.auth-token`, because
  the app is previewed in a cross-origin iframe where third-party cookies are unreliable.
- Authorization is one server-side middleware, `packages/web/src/api/middleware/auth.ts`:

  ```ts
  (process.env.ADMIN_EMAILS ?? "lavishpal408@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase())
  ```

  No session → `ORPCError("UNAUTHORIZED")` → HTTP 401.
  Valid session, email not in the list → `ORPCError("FORBIDDEN", "Not an admin account")` → HTTP 403.

- Every mutating and admin-reading procedure (`posts.adminList`, `posts.get`, `posts.create`,
  `posts.update`, `posts.delete`, `upload.presign`) is built on that middleware. The public
  procedures (`posts.list`, `posts.bySlug`) only ever return published posts.
- The allowlist is never sent to the browser. The frontend only reacts to the `FORBIDDEN` code it
  gets back.

Set it in your `.env`:

```
ADMIN_EMAILS=lavishpal408@gmail.com
```

Multiple admins: comma-separate them. Then sign up once at `/admin` with that email — the first
sign-up with an allowlisted address becomes your admin account. Sign-up is open (Better Auth
allows it), but a non-allowlisted account can do nothing: it gets 403 on every admin call.

> **Hardening tip:** to close public sign-up entirely once your admin account exists, set
> `emailAndPassword: { enabled: true, disableSignUp: true }` in `packages/web/src/api/auth.ts`.

---

## 8. Deployment

The app is a single Bun process: Hono serves the API under `/api` and the built React bundle for
everything else.

```bash
bun install
bun run build                     # typecheck + vite build → packages/web/dist
bun run start                     # pm2 startOrRestart ecosystem.config.cjs
# or without pm2:
PORT=4200 bun packages/web/src/__server.ts
```

Required in the production environment: `NODE_ENV=production`, `WEBSITE_URL` (your real origin, no
trailing slash — Better Auth uses it as its baseURL), `PORT`, `ADMIN_EMAILS`, `DATABASE_URL`,
`DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, and the four `S3_*` values.

Host notes:

- **Runable** (where it runs today) — publishing and custom domains are handled in the platform UI.
  Ports are fixed by `.runable/ports.json`.
- **Any VPS / Fly.io / Railway / Render** — Bun runtime, `bun install && bun run build` as the
  build command, `bun run start` (or the direct `bun packages/web/src/__server.ts`) as the start
  command, and the env vars above. Turso and S3 are both external, so nothing else needs to be
  provisioned.
- **Vercel / Netlify static hosting will not work as-is** — the app needs a running server for the
  API, auth, and presigned uploads.

Set `WEBSITE_URL` to your production origin before first sign-in; a mismatch makes Better Auth
reject the request.

---

## 9. What cannot be migrated automatically

1. **Secrets.** `.env` is not committed. Copy `DATABASE_URL`, `DATABASE_AUTH_TOKEN`,
   `BETTER_AUTH_SECRET`, and the `S3_*` values out of the sandbox environment yourself, or
   generate fresh ones. A new `BETTER_AUTH_SECRET` invalidates existing sessions (harmless — just
   sign in again).
2. **The Turso database itself.** It belongs to the sandbox's Turso account. Either reuse its
   credentials or create your own database and import the snapshot (section 4).
3. **The S3 bucket.** Same story. Objects already uploaded from `/admin` live in the sandbox
   bucket; the 12 migrated article images are repo files and move with the code.
4. **The admin user row.** Accounts live in the database, not in git. On a fresh database, sign up
   again at `/admin` with `lavishpal408@gmail.com`.
5. **Runable platform bindings** — `.runable/`, `__ports.cjs`, `website.config.json`, and the
   `runable.js` analytics snippet are committed for parity, but only mean anything on Runable. They
   are inert elsewhere and safe to delete if you move off the platform.
6. **`node_modules` and build output** — gitignored. Run `bun install` and `bun run build`.
