import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="DepthWizard ISRO Mission Emblem"
      className={cn("h-7 w-7 rounded-full object-cover shadow-sm ring-1 ring-signal-cyan/40", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <LogoMark className="h-8 w-8" />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink flex items-center gap-1.5">
          DepthWizard
          <span className="rounded bg-signal-cyan/15 px-1 py-0.5 font-mono text-[9px] font-medium text-signal-cyan border border-signal-cyan/30">
            ISRO
          </span>
        </span>
        <span className="font-mono text-[10px] text-ink-faint">डेप्थविज़ार्ड · 3D DSM</span>
      </div>
    </span>
  );
}

