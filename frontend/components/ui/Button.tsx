import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-signal-cyan text-void hover:bg-[#63dcec] disabled:bg-line-bright disabled:text-ink-faint",
  secondary:
    "bg-transparent border border-line-bright text-ink hover:border-signal-cyan/60 hover:text-signal-cyan disabled:opacity-40",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-raised",
  danger: "bg-transparent border border-signal-red/40 text-signal-red hover:bg-signal-red/10",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-tight transition-colors disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
