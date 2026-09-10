# lavish-portfolio

Personal portfolio and engineering blog for **Lavish Pal** — platform engineering, DevOps, SRE,
Kubernetes. A procedurally generated animated galaxy sits behind the whole site, and the blog is
written and published from a protected `/admin` dashboard.

## Features

**Galaxy background** (`packages/web/src/web/components/galaxy-background.tsx`)

- Single `<canvas>` — no DOM particles.
- Procedural starfield: ~2300 stars on desktop, count scales down with viewport area (~520 on a
  phone), with per-star size, brightness, and colour temperature (cool blue → white → warm).
- Three parallax depth layers with independent drift.
- Nebula / Milky Way band pre-rendered once per resize: coloured cloud gradients seeded along a
  galactic band (Box–Muller distribution) plus dark dust lanes cut back over it, and a faint core
  glow where the band is densest.
- Twinkle animation driven by per-star phase and speed.
- Mouse parallax (eased pointer tracking) and scroll depth offset per layer.
- Debounced resize handling; the canvas stretches via CSS so it never gaps mid-resize.
- `prefers-reduced-motion: reduce` → one static frame, no rAF loop, no pointer/scroll listeners.
- Pauses entirely when the tab is hidden.
- Readability veil (`.galaxy-veil`) between the canvas and the content: full strength galaxy in
  dark mode, faint (`--galaxy-opacity: 0.07`) in light mode.

**Blog**

- `/blog` listing driven from the database, with a topic filter rail.
- `/blog/:slug` post pages: Markdown rendering, syntax-highlighted code blocks with copy buttons,
  table of contents, tags, cover image, prev/next navigation.
- The three original Hashnode articles migrated in as real database posts with their images
  pulled local.

**Admin**

- `/admin` — email + password auth (Better Auth), bearer token in `localStorage`.
- Server-side allowlist from `ADMIN_EMAILS`. Unauthenticated → `401`, signed in but not
  allowlisted → `403`. Nothing about the allowlist ships in the frontend bundle.
- Create / edit / delete, draft / publish, cover image upload, Markdown editor with live preview.

## Tech stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Runtime   | Bun 1.3, Turborepo workspaces                                 |
| Frontend  | React 19, Vite 7, Tailwind CSS 4, wouter, TanStack Query      |
| API       | Hono 4 + oRPC (typed end-to-end)                              |
| Database  | Turso (libSQL) via Drizzle ORM + drizzle-kit                  |
| Auth      | Better Auth 1.6 (email/password + bearer plugin)              |
| Storage   | S3-compatible bucket for admin image uploads                  |
| Markdown  | react-markdown, remark-gfm, rehype-slug, rehype-highlight     |
| Clients   | `packages/web` (site + API), `packages/mobile` (Expo), `packages/desktop` (Electron shell) |

## Quick start

```bash
bun install
cp .env.example .env          # then fill in DATABASE_URL, BETTER_AUTH_SECRET, S3_*, ADMIN_EMAILS
cd packages/web && bun run db:migrate && bun run db:seed && cd ../..
bun run dev                   # http://localhost:4200
```

Sign up once at `/admin` with the email in `ADMIN_EMAILS` — that account becomes the admin.

## Commands

| Command                        | What it does                                        |
| ------------------------------ | --------------------------------------------------- |
| `bun run dev`                  | Web app on port 4200 (Vite + Hono)                  |
| `bun run build`                | Typecheck + build every package                     |
| `bun run lint`                 | Lint (oxlint via runkit)                            |
| `bun run typecheck`            | TypeScript, no emit                                 |
| `bun run start` / `stop`       | Production server via pm2                           |
| `bun run db:migrate`           | Apply SQL migrations in `packages/web/drizzle`      |
| `bun run db:push`              | Push schema straight to the database (no migration) |
| `bun run db:generate`          | Generate a migration after editing the schema       |
| `cd packages/web && bun run db:seed`   | Seed/refresh the three migrated articles    |
| `cd packages/web && bun run db:export` | Dump `posts` to `scripts/data/posts.json`   |
| `cd packages/web && bun run db:import` | Load that snapshot into `DATABASE_URL`      |

The port comes from `.runable/ports.json` and must not change — preview URLs are derived from it.

## Database, migrations, and deployment

See **[docs/MIGRATION.md](docs/MIGRATION.md)** for the database provider, required tables, how to
apply migrations, how to move the existing blog data (including the three Hashnode posts) to your
own database, where uploaded images live, and deployment instructions.

## Environment variables

Every variable is documented in [`.env.example`](.env.example). The ones the app genuinely needs:
`WEBSITE_URL`, `ADMIN_EMAILS`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`,
`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

## Repository layout

```
packages/web/
  src/api/                 Hono + oRPC API
    auth.ts                Better Auth config
    middleware/auth.ts     ADMIN_EMAILS allowlist (401 / 403)
    routes/posts.ts        public + admin post procedures
    routes/upload.ts       presigned uploads for cover images
    database/schema.ts     Drizzle schema (posts + Better Auth tables)
  src/web/                 React frontend
    components/galaxy-background.tsx
    pages/{index,blog,article,admin,admin-editor}.tsx
  drizzle/                 generated SQL migrations
  scripts/                 seed / export / import + migrated article markdown
  public/images/blog/      images for the migrated articles
packages/mobile/           Expo client (template default screens)
packages/desktop/          Electron shell
```
