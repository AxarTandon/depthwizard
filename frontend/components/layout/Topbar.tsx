"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Bell, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { logout } from "@/lib/auth";
import { AuthUser } from "@/types";

export function Topbar({ user, title }: { user: AuthUser; title: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/auth/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <h1 className="font-display text-[15px] font-medium text-ink">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Search projects…"
            aria-label="Search projects"
            className="focus-ring h-9 w-56 rounded-sm border border-line bg-surface-panel pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-signal-cyan/60"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-sm border border-line text-ink-muted hover:text-ink"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal-cyan" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="focus-ring flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-ink-muted hover:text-ink"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-surface-raised text-[11px] font-medium text-signal-cyan">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-[13px] sm:inline">{user.name}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-20 w-48 rounded-sm border border-line bg-surface-panel py-1 shadow-xl shadow-black/40"
            >
              <div className="border-b border-line px-3 py-2">
                <p className="truncate text-[13px] text-ink">{user.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
              </div>
              <a
                href="/settings"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink-muted hover:bg-surface-raised hover:text-ink"
              >
                <UserIcon className="h-3.5 w-3.5" /> Account settings
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-signal-red hover:bg-surface-raised"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
