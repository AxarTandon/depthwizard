import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-line bg-surface-panel rounded-sm", className)}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-line px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

type BadgeTone = "neutral" | "cyan" | "amber" | "green" | "red";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line-bright text-ink-muted",
  cyan: "border-signal-cyan/40 text-signal-cyan",
  amber: "border-signal-amber/40 text-signal-amber",
  green: "border-signal-green/40 text-signal-green",
  red: "border-signal-red/40 text-signal-red",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatReadout({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[12px] text-ink-faint">{label}</span>
      <span className="font-mono text-xl text-ink font-tabular">
        {value}
        {unit && <span className="ml-1 text-[13px] text-ink-muted">{unit}</span>}
      </span>
    </div>
  );
}
