"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import { AuroraButton } from "./ui/AuroraButton";

export default function LogoutButton() {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    apiFetch("/api/me", { retryOn401: false })
      .then(() => {
        if (!active) return;
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setPending(true);
    try {
      await apiFetch("/api/logout", { method: "POST", expectJson: false });
    } catch (error) {
      console.error("Logout error", getErrorMessage(error));
    } finally {
      setPending(false);
      setStatus("unauthenticated");
      router.push("/login");
    }
  }, [router]);

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AuroraButton
      onClick={handleLogout}
      disabled={pending || status === "loading"}
      variant="ghost"
      className="disabled:opacity-60"
    >
      {pending ? "Logging out..." : "Logout"}
    </AuroraButton>
  );
}
