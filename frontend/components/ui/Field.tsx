import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-muted">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "focus-ring h-11 rounded-sm border border-line bg-surface-panel px-3 text-[14px] text-ink placeholder:text-ink-faint",
            "focus:border-signal-cyan/60",
            error && "border-signal-red/60",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <span id={`${inputId}-hint`} className="text-[12px] text-ink-faint">
            {hint}
          </span>
        )}
        {error && (
          <span id={`${inputId}-error`} className="text-[12px] text-signal-red">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";
