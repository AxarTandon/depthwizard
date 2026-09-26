// ---------------------------------------------------------------------------
// Tiny standalone module so api.ts and auth.ts can both read/write the
// session token without importing each other (avoids a circular import).
// ---------------------------------------------------------------------------

const TOKEN_KEY = "depthwizard_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}
