"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { UserQuotaResponse } from "@/types/user";

export default function QuotaDisplay() {
  const [quota, setQuota] = useState<UserQuotaResponse | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    apiFetch<UserQuotaResponse>("/api/auth/users/me/quota", { retryOn401: false })
      .then(({ data }) => { if (active) setQuota(data); })
      .catch(() => { if (active) setQuota(null); });
    return () => { active = false; };
  }, []);

  if (quota === undefined || !quota) return null;
  if (quota.weekly_limit === -1) return null;

  const isExceeded = quota.remaining <= 0;
  const isLowQuota = quota.percentage_used >= 90;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] font-semibold",
        isExceeded
          ? "border-border-rose bg-rose-veil text-text-rose"
          : isLowQuota
          ? "border-border-panel-strong bg-notice text-gold"
          : "border-border-aurora bg-aurora-haze text-text-aurora"
      )}
      title={`Weekly message quota: ${quota.used}/${quota.weekly_limit} used. Resets on ${new Date(quota.next_reset_date).toLocaleDateString()}`}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isExceeded ? "bg-text-rose" : isLowQuota ? "bg-gold animate-pulse" : "bg-text-aurora"
        )}
      />
      <span>{quota.remaining}/{quota.weekly_limit}</span>
    </div>
  );
}
