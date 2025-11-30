import { cookies, headers } from "next/headers";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import AiManagementClient from "./AiManagementClient";

type RoomResponseStrategy = "room_mention_only" | "room_probabilistic" | "room_active" | "no_response";
type ConversationResponseStrategy = "conv_every_message" | "conv_on_questions" | "conv_smart" | "no_response";

type AIEntity = {
  id: number;
  username: string;
  description: string | null;
  system_prompt: string;
  model_name: string;
  temperature: number | null;
  max_tokens: number | null;
  room_response_strategy: RoomResponseStrategy;
  conversation_response_strategy: ConversationResponseStrategy;
  response_probability: number | null;
  cooldown_seconds: number | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  status: "online" | "offline";
  current_room_id: number | null;
  current_room_name: string | null;
  created_at: string;
  updated_at: string | null;
};

export const dynamic = "force-dynamic";

async function buildRequestContext() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("tg_access");

  if (!accessCookie) {
    return { authenticated: false as const };
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const defaultHeaders = {
    cookie: cookieHeader,
    authorization: `Bearer ${accessCookie.value}`,
    accept: "application/json",
  };

  return { authenticated: true as const, baseUrl, defaultHeaders };
}

export default async function AdminAiPage() {
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Please sign in as an administrator to manage AI entities.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  const { baseUrl, defaultHeaders } = ctx;

  const meResponse = await fetch(`${baseUrl}/api/me`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (meResponse.status === 401) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          Session expired. Please sign in again.
        </p>
      </GlassPanel>
    );
  }

  const me = await meResponse.json();

  if (!me?.is_admin) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          This page is restricted to administrators.
        </p>
      </GlassPanel>
    );
  }

  const entitiesResponse = await fetch(`${baseUrl}/api/ai/entities`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

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

  const entities: AIEntity[] = await entitiesResponse.json();

  return <AiManagementClient initialEntities={entities} />;
}
