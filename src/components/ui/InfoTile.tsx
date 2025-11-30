import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type InfoTileProps = {
  title: ReactNode;
  value: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

export default function InfoTile({ title, value, subtitle, className }: InfoTileProps) {
  return (
    <div className={cn("rounded-2xl border border-border-panel bg-surface-soft px-4 py-3 space-y-2", className)}>
      <dt className="text-[0.68rem] uppercase tracking-[0.3em] text-text-subtle">{title}</dt>
      <dd className="text-sm font-semibold text-white tracking-normal">{value}</dd>
      {subtitle && (
        <p className="text-[0.6rem] uppercase tracking-[0.32em] text-text-faint">{subtitle}</p>
      )}
    </div>
  );
}
