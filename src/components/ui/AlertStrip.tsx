import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertVariant = "info" | "notice" | "warning" | "danger";

const variantClasses: Record<AlertVariant, string> = {
  info: "border border-border-aurora bg-surface-soft text-text-aurora",
  notice: "border border-border-panel-strong bg-notice text-gold",
  warning: "border border-border-mist-strong bg-surface-soft text-text-soft",
  danger: "border border-border-rose bg-rose-veil text-text-rose",
};

interface AlertStripProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}

export default function AlertStrip({ children, variant = "info", className }: AlertStripProps) {
  return (
    <div
      className={cn(
        "rounded-3xl px-6 py-4 text-sm leading-relaxed",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
