import type { RouterClient } from "@orpc/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { posts } from "./routes/posts";
import { upload } from "./routes/upload";
import { auth } from "./auth";
import { s3 } from "./lib/s3";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
export const router = {
  ping,
  posts,
  upload,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

// Better Auth (email + password for the blog admin).
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Public read access to uploaded blog images: redirect to a short-lived
// presigned GET so the storage bucket itself stays private.
app.get("/api/media/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, "");
  if (!key) return c.json({ error: "Missing key" }, 400);
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: decodeURIComponent(key) }),
      { expiresIn: 3600 },
    );
    return c.redirect(url, 302);
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
});

export default app;
