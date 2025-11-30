import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import type { UserQuotaResponse } from "@/types/user";

type QuotaStatus = {
  exceeded: boolean;
  resetDate: string | null;
  loading: boolean;
};

/**
 * Hook to check if the current user has exceeded their quota.
 * Fetches quota status once on mount and caches the result.
 *
 * @returns {QuotaStatus} - exceeded, resetDate, loading
 *
 * @example
 * ```tsx
 * const { exceeded, resetDate, loading } = useQuotaStatus();
 *
 * if (loading) return <LoadingSpinner />;
 * if (exceeded) return <QuotaBanner resetDate={resetDate} />;
 * ```
 */
export function useQuotaStatus(): QuotaStatus {
  const [status, setStatus] = useState<QuotaStatus>({
    exceeded: false,
    resetDate: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    apiFetch<UserQuotaResponse>("/api/auth/users/me/quota", { retryOn401: false })
      .then(({ data }) => {
        if (!active) return;

        // Unlimited quota (Admin) - never exceeded
        if (data.weekly_limit === -1) {
          setStatus({
            exceeded: false,
            resetDate: null,
            loading: false,
          });
          return;
        }

        // Check if quota is exceeded (remaining <= 0)
        const exceeded = data.remaining <= 0;

        setStatus({
          exceeded,
          resetDate: exceeded ? data.next_reset_date : null,
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        // On error, assume not exceeded (fail gracefully)
        setStatus({
          exceeded: false,
          resetDate: null,
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return status;
}
