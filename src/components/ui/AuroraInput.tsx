import { useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface AuroraInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function AuroraInput({ label, error, className, id, ...rest }: AuroraInputProps) {
  const autoId = useId();
  const derivedId = label ? `${label.toLowerCase().replace(/\s+/g, "-")}-${autoId}` : autoId;
  const inputId = id ?? derivedId;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-[0.32em] text-text-soft"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn("input-field", error && "border-border-rose focus:border-border-rose", className)}
        {...rest}
      />
      {error && (
        <p className="text-xs text-text-rose mt-1">{error}</p>
      )}
    </div>
  );
}

export interface AuroraTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function AuroraTextarea({ label, error, className, id, rows = 4, ...rest }: AuroraTextareaProps) {
  const autoId = useId();
  const derivedId = label ? `${label.toLowerCase().replace(/\s+/g, "-")}-${autoId}` : autoId;
  const inputId = id ?? derivedId;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-[0.32em] text-text-soft"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={cn("input-field resize-none", error && "border-border-rose focus:border-border-rose", className)}
        {...rest}
      />
      {error && (
        <p className="text-xs text-text-rose mt-1">{error}</p>
      )}
    </div>
  );
}
