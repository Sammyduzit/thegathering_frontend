import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { buildRequestContext } from "@/lib/server/request-context";
import type { AIEntityResponse } from "@/types/ai-entity";
import type { MemoryListResponse } from "@/lib/memories";
import type { ConversationDetail } from "@/types/conversation";
import ConversationMemoriesClient from "./ConversationMemoriesClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ entityId: string; conversationId: string }>;
};

export default async function ConversationMemoriesPage({ params }: Props) {
  const { entityId, conversationId } = await params;
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    redirect("/login");
  }

  const { baseUrl, defaultHeaders } = ctx;

  // Check admin
  const meResponse = await fetch(`${baseUrl}/api/me`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!meResponse.ok) {
    redirect("/login");
  }

  const me = await meResponse.json();

  if (!me?.is_admin) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Unauthorized</h1>
        <p className="mt-4 text-sm text-muted">This page is restricted to administrators.</p>
      </GlassPanel>
    );
  }

  // Fetch AI entity
  const entityResponse = await fetch(`${baseUrl}/api/ai/entities/${entityId}`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!entityResponse.ok) {
    if (entityResponse.status === 404) {
      notFound();
    }
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Error</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load AI entity (status {entityResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const entity: AIEntityResponse = await entityResponse.json();

  // Fetch conversation details (to get participants for user_ids)
  const conversationResponse = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!conversationResponse.ok) {
    if (conversationResponse.status === 404) {
      notFound();
    }
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Error</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load conversation (status {conversationResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const conversation: ConversationDetail = await conversationResponse.json();

  // Fetch memories for this conversation
  const memoriesResponse = await fetch(
    `${baseUrl}/api/memories?entity_id=${entityId}&conversation_id=${conversationId}&include_short_term=false&page=1&page_size=100`,
    {
      headers: defaultHeaders,
      cache: "no-store",
    }
  );

  if (!memoriesResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Error</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load memories (status {memoriesResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const memories: MemoryListResponse = await memoriesResponse.json();

  return (
    <GlassPanel as="section" className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
            Conversation #{conversationId}
          </h1>
          <a
            href={`/admin/memories/${entityId}`}
            className="text-xs uppercase tracking-[0.28em] text-text-soft hover:text-white transition-colors"
          >
            ← Back to {entity.username}
          </a>
        </div>
        <div className="text-sm text-muted space-y-1">
          <p>
            Entity: <span className="text-white">{entity.username}</span>
          </p>
          <p>
            Participants:{" "}
            <span className="text-white">
              {conversation.participants.map((p) => p.username).join(", ")}
            </span>
          </p>
          <p>
            Type: <span className="text-white">{conversation.type}</span> · Room:{" "}
            <span className="text-white">{conversation.room_name || "—"}</span>
          </p>
        </div>
      </header>

      <ConversationMemoriesClient
        entity={entity}
        conversation={conversation}
        initialMemories={memories}
      />
    </GlassPanel>
  );
}
