"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton, AuroraLinkButton } from "@/components/ui/AuroraButton";
import { AuroraInput } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiFetch("/api/register", {
        method: "POST",
        body: { email, username, password },
        csrf: false,
        retryOn401: false,
        expectJson: false,
      });
      router.push("/me");
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
            <span>New traveler</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Create an account</h1>
          <p className="text-sm text-text-subtle leading-relaxed">
            Forge your presence in the clearing. Pick a name, share an email, and set a password the night can keep.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <AuroraInput
            label="Username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a moniker"
          />
          <AuroraInput
            label="Email"
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <AuroraInput
            label="Password"
            id="register-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secret"
          />
          <AuroraButton type="submit" disabled={pending} className="w-full justify-center">
            {pending ? "Registering..." : "Register"}
          </AuroraButton>
        </form>

        {error && <AlertStrip variant="danger">{error}</AlertStrip>}

        <p className="text-xs text-text-subtle text-center">
          Already part of the circle?
          <AuroraLinkButton
            href="/login"
            variant="ghost"
            className="ml-2 text-[0.65rem] uppercase tracking-[0.32em]"
          >
            Log in
          </AuroraLinkButton>
        </p>
      </GlassPanel>
    </div>
  );
}
