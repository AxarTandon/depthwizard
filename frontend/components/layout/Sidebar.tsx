"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  Cpu,
  Box,
  LineChart,
  ShieldCheck,
  Settings,
  Info,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { USE_BACKEND } from "@/lib/config";

const NAV_ITEMS = [
  { href: "/workspace", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/workspace#projects", label: "Projects", icon: FolderKanban },
  { href: "/workspace/upload", label: "Upload", icon: UploadCloud },
  { href: "/workspace/processing", label: "Processing", icon: Cpu },
  { href: "/workspace/viewer", label: "3D Viewer", icon: Box },
  { href: "/workspace/analysis", label: "Analysis", icon: LineChart },
  { href: "/workspace/validation", label: "Validation", icon: ShieldCheck },
];

const FOOTER_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-18 items-center border-b border-line px-5 py-3">
        <Link href="/" className="focus-ring rounded-sm">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Workspace navigation">
        <div className="px-3 pb-2 text-[10.5px] font-mono uppercase tracking-wider text-ink-faint">
          Platform Navigation
        </div>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href.split("#")[0]) && item.href !== "/workspace";
            const isOverviewActive = item.href === "/workspace" && pathname === "/workspace";
            const isCurrent = active || isOverviewActive;
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-all",
                    isCurrent
                      ? "border-l-2 border-signal-cyan bg-signal-cyan/10 font-medium text-signal-cyan"
                      : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isCurrent ? "text-signal-cyan" : "text-ink-faint group-hover:text-ink"
                    )}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-line" />

        <div className="px-3 pb-2 text-[10.5px] font-mono uppercase tracking-wider text-ink-faint">
          Project Info
        </div>
        <ul className="flex flex-col gap-1">
          {FOOTER_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-all",
                    active
                      ? "border-l-2 border-signal-cyan bg-signal-cyan/10 font-medium text-signal-cyan"
                      : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      active ? "text-signal-cyan" : "text-ink-faint group-hover:text-ink"
                    )}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line bg-surface-raised/30 px-5 py-3.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-green" />
            </span>
            <span className="font-medium text-signal-green">LIVE BACKEND</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">FastAPI</span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-ink-faint truncate">
          SIH 2026 · Doom&apos;s Dhoom
        </p>
      </div>
    </aside>
  );
}
