import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";
import MeClient from "./MeClient";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import { SUPPORTED_LANGUAGES } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GlassPanel className="px-7 py-10 text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Profile</h1>
          <p className="mt-4 text-text-muted leading-relaxed">
            Please sign in to view your profile.
          </p>
          <AuroraLinkButton href="/login" className="mx-auto text-xs uppercase tracking-[0.3em]">
            Sign in
          </AuroraLinkButton>
        </GlassPanel>
      </div>
    );
  }

  const res = await fetchBackend("/auth/me");

  if (!res.ok) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GlassPanel className="px-7 py-10 text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Profile</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-rose bg-rose-veil">
            <span className="w-1.5 h-1.5 rounded-full bg-text-rose" />
            <span className="text-[0.65rem] uppercase tracking-[0.24em] text-text-rose">
              Unable to load profile
            </span>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const me = await res.json();

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-7">
      <GlassPanel as="header" className="rounded-3xl px-7 py-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-border-aurora bg-surface-soft text-[0.65rem] uppercase tracking-[0.28em] text-text-soft">
          <span>Identity beacon</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">My profile</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Update your account details and review exactly what the backend knows about you.
        </p>
      </GlassPanel>
      <MeClient
        initialProfile={me}
        supportedLanguages={[...SUPPORTED_LANGUAGES]}
      />
    </div>
  );
}
