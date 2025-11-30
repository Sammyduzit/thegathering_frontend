"use client";

import { useQuotaStatus } from "@/hooks/useQuotaStatus";
import QuotaExceededBanner from "./QuotaExceededBanner";

export default function QuotaBannerWrapper() {
  const { exceeded, resetDate, loading } = useQuotaStatus();

  if (loading || !exceeded || !resetDate) {
    return null;
  }

  return <QuotaExceededBanner resetDate={resetDate} />;
}
