import { cookies, headers } from "next/headers";
import MeClient from "./MeClient";
import GlassPanel from "@/components/ui/GlassPanel";
import AlertStrip from "@/components/ui/AlertStrip";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import type { UserQuotaResponse } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("tg_access");

  if (!accessCookie) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <GlassPanel className="px-7 py-10 text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Profile</h1>
          <AlertStrip variant="notice" className="text-xs uppercase tracking-[0.32em]">
            Not logged in.
          </AlertStrip>
          <AuroraLinkButton href="/login" className="mx-auto text-xs uppercase tracking-[0.3em]">
            Sign in
          </AuroraLinkButton>
        </GlassPanel>
      </main>
    );
  }

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <GlassPanel className="px-7 py-10 text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Profile</h1>
          <AlertStrip variant="danger" className="text-xs uppercase tracking-[0.32em]">
            Unable to load profile information.
          </AlertStrip>
        </GlassPanel>
      </main>
    );
  }

  const me = await res.json();

  let quota: UserQuotaResponse | null = null;
  try {
    const quotaRes = await fetch(`${baseUrl}/api/auth/users/me/quota`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (quotaRes.ok) {
      quota = (await quotaRes.json()) as UserQuotaResponse;
    }
  } catch {
    quota = null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-7">
      <GlassPanel as="header" className="rounded-3xl px-7 py-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-border-aurora bg-surface-soft text-[0.65rem] uppercase tracking-[0.28em] text-text-soft">
          <span>Identity beacon</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">My profile</h1>
        <p className="text-sm text-muted leading-relaxed">
          Update your account details and review exactly what the backend knows about you.
        </p>
      </GlassPanel>
      <MeClient
        initialProfile={me}
        initialQuota={quota}
        supportedLanguages={SUPPORTED_LANGUAGES}
      />
    </main>
  );
}

const SUPPORTED_LANGUAGES = [
  "en",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pl",
  "pt",
  "ru",
  "ja",
  "zh",
];
