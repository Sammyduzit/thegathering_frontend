"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import type { UserQuotaResponse } from "@/types/user";

export default function QuotaDisplay() {
  const [quota, setQuota] = useState<UserQuotaResponse | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch<UserQuotaResponse>("/api/auth/users/me/quota", { retryOn401: false })
      .then(({ data }) => {
        if (!active) return;
        setQuota(data);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setQuota(null);
      });

    return () => {
      active = false;
    };
  }, []);

  // Loading state
  if (quota === undefined) {
    return null;
  }

  // Error or no quota data
  if (error || !quota) {
    return null;
  }

  // Unlimited quota (Admin)
  if (quota.weekly_limit === -1) {
    return null;
  }

  // Calculate warning state (< 10% remaining)
  const isLowQuota = quota.percentage_used >= 90;
  const isExceeded = quota.remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] font-semibold ${
        isExceeded
          ? "border-red-500/50 bg-red-950/30 text-red-400"
          : isLowQuota
          ? "border-yellow-500/50 bg-yellow-950/30 text-yellow-400"
          : "border-border-aurora bg-aurora-haze/30 text-text-aurora"
      }`}
      title={`Weekly message quota: ${quota.used}/${quota.weekly_limit} used. Resets on ${new Date(quota.next_reset_date).toLocaleDateString()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isExceeded ? "bg-red-400" : isLowQuota ? "bg-yellow-400 animate-pulse" : "bg-text-aurora"
        }`}
      />
      <span>
        {quota.remaining}/{quota.weekly_limit}
      </span>
    </div>
  );
}
