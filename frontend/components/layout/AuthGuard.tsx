"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthUser } from "@/types";

export function AuthGuard({ children }: { children: (user: AuthUser) => React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/login");
      return;
    }
    setUser(session);
  }, [router]);

  if (user === "loading" || user === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-void">
        <div className="flex items-center gap-3 text-ink-muted">
          <span className="h-2 w-2 animate-pulseSoft rounded-full bg-signal-cyan" />
          <span className="text-sm font-mono">Verifying session…</span>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
