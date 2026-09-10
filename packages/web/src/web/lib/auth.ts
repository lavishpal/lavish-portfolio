import { createAuthClient } from "better-auth/react";

/**
 * Email + password auth for the blog admin. The app is previewed inside a
 * cross-origin iframe, where third-party cookies are unreliable, so the
 * session rides on the bearer token Better Auth returns in `set-auth-token`.
 */
const TOKEN_KEY = "lavish.auth-token";

export function getAuthToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function setAuthToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage disabled — session lasts for the page only */
  }
}

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getAuthToken() },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setAuthToken(token);
    },
  },
});

export async function signOut() {
  try {
    await authClient.signOut();
  } finally {
    setAuthToken("");
  }
}
