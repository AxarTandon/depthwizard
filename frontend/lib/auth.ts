// ---------------------------------------------------------------------------
// DepthWizard — authentication
//
// When NEXT_PUBLIC_USE_BACKEND=true, this calls the real FastAPI backend
// (JWT-based) and stores the returned token for api.ts to attach as an
// Authorization header. Otherwise it falls back to the original demo mode
// (localStorage-simulated accounts) so the app still works with no backend
// configured. Every exported function signature is unchanged either way.
// ---------------------------------------------------------------------------

import { AuthUser } from "@/types";
import { API_BASE_URL, USE_BACKEND } from "./config";
import { getToken as getStoredToken, setToken, clearToken } from "./auth-token";

const USERS_KEY = "depthwizard_users";
const SESSION_KEY = "depthwizard_session";

interface StoredUser extends AuthUser {
  password: string; // demo only — never store plaintext passwords in production
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  organization?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** The bearer token for the current session, if using the real backend. */
export function getToken(): string | null {
  return getStoredToken();
}

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not load the current user");
  return res.json();
}

export async function signup(input: SignupInput): Promise<{ user: AuthUser } | { error: string }> {
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.detail ?? "Signup failed." };
      }
      const { access_token } = await res.json();
      setToken(access_token);
      const user = await fetchMe(access_token);
      setSession(user);
      return { user };
    } catch {
      return { error: "Could not reach the backend. Is it running?" };
    }
  }

  const users = readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (exists) {
    return { error: "An account with this email already exists." };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const user: StoredUser = {
    id: `user-${Date.now()}`,
    name: input.name,
    email: input.email,
    organization: input.organization,
    createdAt: new Date().toISOString(),
    password: input.password,
  };

  users.push(user);
  writeUsers(users);

  const { password, ...publicUser } = user;
  setSession(publicUser);
  return { user: publicUser };
}

export async function login(input: LoginInput): Promise<{ user: AuthUser } | { error: string }> {
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.detail ?? "Incorrect email or password." };
      }
      const { access_token } = await res.json();
      setToken(access_token);
      const user = await fetchMe(access_token);
      setSession(user);
      return { user };
    } catch {
      return { error: "Could not reach the backend. Is it running?" };
    }
  }

  const users = readUsers();
  const found = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());

  if (!found || found.password !== input.password) {
    return { error: "Incorrect email or password." };
  }

  const { password, ...publicUser } = found;
  setSession(publicUser);
  return { user: publicUser };
}

export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  if (USE_BACKEND) {
    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
    } catch {
      // Intentionally swallow errors — the backend also always reports success
      // here, to avoid leaking which emails are registered.
    }
    return { ok: true };
  }
  // Demo mode: no email is actually sent. Always resolves successfully so the
  // flow can be reviewed end-to-end without a mail backend.
  return { ok: true };
}

export function setSession(user: AuthUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  clearToken();
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
