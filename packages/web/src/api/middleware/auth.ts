import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";

/**
 * Emails allowed into the admin dashboard. Anyone else, even with a valid
 * session, is rejected. Set ADMIN_EMAILS in .env (comma separated) to change.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "lavishpal408@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Optional auth — `context.user` is the session user or null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, session: session?.session ?? null },
  });
});

/** Admin-only procedures. Requires a session whose email is allowlisted. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  if (!adminEmails().includes(session.user.email.toLowerCase())) {
    throw new ORPCError("FORBIDDEN", { message: "Not an admin account" });
  }
  return next({ context: { user: session.user, session: session.session } });
});
