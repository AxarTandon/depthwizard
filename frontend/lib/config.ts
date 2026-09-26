// ---------------------------------------------------------------------------
// Shared runtime config — single source for both api.ts and auth.ts so
// neither has to import the other (avoids a circular dependency).
// ---------------------------------------------------------------------------

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";
