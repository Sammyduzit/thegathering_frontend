import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import AiManagementClient from "./AiManagementClient";
import type { AIEntityResponse } from "@/types/ai-entity";
import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  const ctx = await buildRequestContext({ fetchUser: true });

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-text-muted leading-relaxed">
          Please sign in as an administrator to manage AI entities.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  if (!ctx.user?.is_admin) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          This page is restricted to administrators.
        </p>
      </GlassPanel>
    );
  }

  const entitiesResponse = await fetchBackend("/ai/entities");

  if (!entitiesResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          Failed to load AI data (status {entitiesResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const entities: AIEntityResponse[] = await entitiesResponse.json();

  const configResponse = await fetchBackend("/ai/config");
  const agentModeGlobal = configResponse.ok
    ? ((await configResponse.json()) as { agent_mode_enabled: boolean }).agent_mode_enabled
    : false;

  return <AiManagementClient initialEntities={entities} agentModeGlobal={agentModeGlobal} />;
}
