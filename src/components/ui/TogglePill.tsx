import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "aurora" | "gold";

const activeClasses: Record<Tone, string> = {
  aurora: "border border-border-aurora bg-aurora-haze text-text-aurora",
  gold: "border border-border-panel-strong bg-notice text-gold",
};

interface TogglePillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: Tone;
}

export default function TogglePill({ active = false, tone = "aurora", className, ...rest }: TogglePillProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] transition-colors disabled:opacity-50",
        active ? activeClasses[tone] : "border border-border-mist-strong text-text-soft hover:bg-surface-deep",
        className
      )}
      {...rest}
    />
  );
}
