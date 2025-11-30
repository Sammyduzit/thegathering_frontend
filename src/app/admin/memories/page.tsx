import { redirect } from "next/navigation";
import Link from "next/link";
import GlassPanel from "@/components/ui/GlassPanel";
import { buildRequestContext } from "@/lib/server/request-context";
import type { AIEntityResponse } from "@/types/ai-entity";

export const dynamic = "force-dynamic";

export default async function AdminMemoriesPage() {
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    redirect("/login");
  }

  const { baseUrl, defaultHeaders } = ctx;

  // Check if user is admin
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
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Memory Management</h1>
        <p className="mt-4 text-sm text-muted">This page is restricted to administrators.</p>
      </GlassPanel>
    );
  }

  // Fetch all AI entities
  const entitiesResponse = await fetch(`${baseUrl}/api/ai/entities/available`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!entitiesResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Memory Management</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load AI entities (status {entitiesResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const entities: AIEntityResponse[] = await entitiesResponse.json();

  return (
    <GlassPanel as="section" className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Memory Management</h1>
        <p className="mt-2 text-sm text-muted">
          Select an AI entity to manage its memories (personality knowledge and conversation archives).
        </p>
      </header>

      {/* Info Card */}
      <div className="rounded-2xl border border-border-panel bg-surface-soft p-6 space-y-3">
        <h2 className="text-base font-semibold text-white">About Memory Management</h2>
        <div className="text-sm text-muted space-y-2">
          <p>
            <strong className="text-white">Personality Memories:</strong> Global knowledge base
            uploaded as large text (books, documentation, etc.). These memories are available to
            the AI across all conversations.
          </p>
          <p>
            <strong className="text-white">Long-Term Memories:</strong> Archived conversation
            summaries that are automatically created when conversations are deleted. These help
            the AI remember past interactions with specific users.
          </p>
          <p className="text-xs text-text-faint">
            Memory chunks are embedded using vector embeddings and retrieved via hybrid
            search (70% vector + 30% keywords).
          </p>
        </div>
      </div>

      {/* Entity List */}
      <div className="space-y-3">
        {entities.length === 0 ? (
          <p className="text-sm text-text-soft text-center py-8">
            No AI entities found. Create an AI entity first in the AI Management page.
          </p>
        ) : (
          entities.map((entity) => (
            <Link
              key={entity.id}
              href={`/admin/memories/${entity.id}`}
              className="block rounded-2xl border border-border-panel bg-surface-soft p-5 hover:bg-surface-deep hover:border-border-panel-strong transition-all group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white group-hover:text-gold transition-colors">
                    {entity.username}
                  </h3>
                  <p className="mt-1 text-sm text-muted truncate">
                    {entity.description || "No description"}
                  </p>
                  <p className="mt-2 text-xs text-text-faint">
                    Model: {entity.model_name} · Status: {entity.status}
                  </p>
                </div>
                <div className="text-right text-xs text-text-soft">
                  <p>ID: {entity.id}</p>
                  {entity.current_room_name && (
                    <p className="mt-1">Room: {entity.current_room_name}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </GlassPanel>
  );
}
