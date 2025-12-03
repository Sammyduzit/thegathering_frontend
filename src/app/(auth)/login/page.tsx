"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton, AuroraLinkButton } from "@/components/ui/AuroraButton";
import { AuroraInput } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiFetch("/api/login", {
        method: "POST",
        body: { email, password },
        csrf: false,
        retryOn401: false,
        expectJson: false,
      });
      router.push("/rooms");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <GlassPanel className="px-8 py-10 space-y-6">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-border-aurora bg-surface-soft text-[0.65rem] uppercase tracking-[0.28em] text-text-soft">
            <span>Return to the circle</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Log in</h1>
          <p className="text-sm text-text-subtle leading-relaxed">
            Share the clearing with us again &mdash; enter your credentials and step back under the stars.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <AuroraInput
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <AuroraInput
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <AuroraButton type="submit" disabled={pending} className="w-full justify-center">
            {pending ? "Logging in..." : "Log in"}
          </AuroraButton>
        </form>

        {error && <AlertStrip variant="danger">{error}</AlertStrip>}

        <p className="text-xs text-text-subtle text-center">
          Need a new account?
          <AuroraLinkButton
            href="/register"
            variant="ghost"
            className="ml-2 text-[0.65rem] uppercase tracking-[0.32em]"
          >
            Register
          </AuroraLinkButton>
        </p>
      </GlassPanel>
    </div>
  );
}
