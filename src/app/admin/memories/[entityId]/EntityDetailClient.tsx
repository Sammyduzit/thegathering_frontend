"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AIEntityResponse } from "@/types/ai-entity";
import type { MemoryListResponse, MemoryResponse, PersonalityUploadRequest } from "@/lib/memories";
import { uploadPersonality } from "@/lib/memories";
import { getErrorMessage } from "@/types/api-error";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraTextarea } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type Props = {
  entity: AIEntityResponse;
  initialMemories: MemoryListResponse;
};

type Tab = "personality" | "conversations";

export default function EntityDetailClient({ entity, initialMemories }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("personality");
  const [showPersonalityUpload, setShowPersonalityUpload] = useState(false);
  const [personalityForm, setPersonalityForm] = useState({
    text: "",
    category: "",
    metadata: "",
  });
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Separate memories into personality and conversation-based
  const { personalityMemories, conversationGroups } = useMemo(() => {
    const personality: MemoryResponse[] = [];
    const conversationMap = new Map<number, MemoryResponse[]>();

    initialMemories.memories.forEach((memory) => {
      // Personality memories have no conversation_id
      if (memory.conversation_id === null) {
        personality.push(memory);
      } else {
        const existing = conversationMap.get(memory.conversation_id) || [];
        existing.push(memory);
        conversationMap.set(memory.conversation_id, existing);
      }
    });

    // Sort conversation groups by conversation_id descending (latest first)
    const groups = Array.from(conversationMap.entries())
      .map(([conversationId, memories]) => ({
        conversationId,
        memories,
        totalChunks: memories.length,
        latestMemory: memories.reduce((latest, mem) =>
          new Date(mem.created_at) > new Date(latest.created_at) ? mem : latest
        ),
      }))
      .sort((a, b) => b.conversationId - a.conversationId);

    return {
      personalityMemories: personality,
      conversationGroups: groups,
    };
  }, [initialMemories]);

  const handleUploadPersonality = async () => {
    setUploading(true);
    setFeedback(null);
    setError(null);

    try {
      const text = personalityForm.text.trim();
      if (!text) {
        throw new Error("Personality text is required.");
      }

      const request: PersonalityUploadRequest = {
        text,
        category: personalityForm.category.trim() || "general",
        metadata: personalityForm.metadata.trim()
          ? JSON.parse(personalityForm.metadata)
          : undefined,
      };

      const result = await uploadPersonality(entity.id, request);

      setFeedback(
        `Success! Created ${result.created_memories} personality memories (${result.chunks} chunks).`
      );
      setPersonalityForm({ text: "", category: "", metadata: "" });
      setShowPersonalityUpload(false);

      // Refresh page to show new memories
      setRefreshing(true);
      router.refresh();
      // Note: refreshing state will be reset when component re-renders with new data
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleNavigateToConversation = (conversationId: number) => {
    router.push(`/admin/memories/${entity.id}/conversation/${conversationId}`);
  };

  return (
    <div className="space-y-6">
      {(feedback || error) && (
        <div className="space-y-2">
          {feedback && <AlertStrip variant="notice">{feedback}</AlertStrip>}
          {error && <AlertStrip variant="danger">{error}</AlertStrip>}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-panel">
        <button
          onClick={() => setActiveTab("personality")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "personality"
              ? "border-b-2 border-gold text-white"
              : "text-text-soft hover:text-white"
          }`}
        >
          Personality Memories ({personalityMemories.length})
        </button>
        <button
          onClick={() => setActiveTab("conversations")}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "conversations"
              ? "border-b-2 border-gold text-white"
              : "text-text-soft hover:text-white"
          }`}
        >
          Long-Term Conversations ({conversationGroups.length})
        </button>
      </div>

      {/* Tab: Personality Memories */}
      {activeTab === "personality" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted">
              Global knowledge base (books, documentation, etc.). No user-specific context.
            </p>
            <AuroraButton
              onClick={() => setShowPersonalityUpload((prev) => !prev)}
              variant="ghost"
              className="text-xs uppercase tracking-[0.28em]"
            >
              {showPersonalityUpload ? "Cancel" : "Upload Personality"}
            </AuroraButton>
          </div>

          {showPersonalityUpload && (
            <div className="rounded-3xl border border-border-panel bg-surface-deep p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Upload Personality Data</h3>

              <div>
                <label className="block text-sm font-medium text-white mb-2" htmlFor="category">
                  Category
                </label>
                <input
                  id="category"
                  className="input-field w-full"
                  placeholder="e.g., books, documentation, onboarding"
                  value={personalityForm.category}
                  onChange={(e) =>
                    setPersonalityForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2" htmlFor="metadata">
                  Metadata (JSON, optional)
                </label>
                <AuroraTextarea
                  id="metadata"
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='{"source": "Harry Potter", "chapter": 1}'
                  value={personalityForm.metadata}
                  onChange={(e) =>
                    setPersonalityForm((prev) => ({ ...prev, metadata: e.target.value }))
                  }
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2" htmlFor="text">
                  Text Content *
                </label>
                <AuroraTextarea
                  id="text"
                  rows={12}
                  placeholder="Paste large text here (books, documentation, etc.). Backend will automatically chunk and embed..."
                  value={personalityForm.text}
                  onChange={(e) =>
                    setPersonalityForm((prev) => ({ ...prev, text: e.target.value }))
                  }
                  disabled={uploading}
                />
                <p className="mt-2 text-xs text-text-faint">
                  Text will be chunked into 500-character segments and embedded automatically.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <AuroraButton
                  onClick={() => setShowPersonalityUpload(false)}
                  variant="ghost"
                  disabled={uploading}
                  className="text-xs uppercase tracking-[0.28em]"
                >
                  Cancel
                </AuroraButton>
                <AuroraButton
                  onClick={handleUploadPersonality}
                  disabled={uploading || !personalityForm.text.trim()}
                  className="text-xs uppercase tracking-[0.28em]"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </AuroraButton>
              </div>
            </div>
          )}

          {/* Personality Memories List */}
          <div className="space-y-3">
            {refreshing ? (
              <LoadingSkeleton variant="list" count={3} />
            ) : personalityMemories.length === 0 ? (
              <p className="text-sm text-text-soft text-center py-8">
                No personality memories yet. Upload some knowledge above!
              </p>
            ) : null}

            {!refreshing && personalityMemories.map((memory) => {
              const metadata = memory.memory_metadata as Record<string, unknown> | null;
              const category = metadata?.category as string | undefined;

              return (
                <div
                  key={memory.id}
                  className="rounded-2xl border border-border-panel bg-surface-soft p-4 hover:bg-surface-deep transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{memory.summary}</p>
                      {category && (
                        <span className="inline-block mt-2 px-2 py-1 rounded-full bg-aurora-haze border border-border-aurora text-[0.65rem] uppercase tracking-[0.28em] text-text-aurora">
                          {category}
                        </span>
                      )}
                      <p className="mt-2 text-xs text-text-faint">
                        Keywords: {memory.keywords.length ? memory.keywords.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-soft">
                      <p>ID: {memory.id}</p>
                      <p>Score: {memory.importance_score.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Long-Term Conversations */}
      {activeTab === "conversations" && (
        <div className="space-y-6">
          <p className="text-sm text-muted">
            Archived conversation memories. Click to view and manage memory chunks.
          </p>

          <div className="space-y-3">
            {refreshing ? (
              <LoadingSkeleton variant="list" count={3} />
            ) : conversationGroups.length === 0 ? (
              <p className="text-sm text-text-soft text-center py-8">
                No long-term conversation memories yet. These are created automatically when
                conversations are archived.
              </p>
            ) : null}

            {!refreshing && conversationGroups.map((group) => {
              const metadata = group.latestMemory.memory_metadata as Record<string, unknown> | null;
              const type = metadata?.type as string | undefined;

              return (
                <button
                  key={group.conversationId}
                  onClick={() => handleNavigateToConversation(group.conversationId)}
                  className="w-full rounded-2xl border border-border-panel bg-surface-soft p-5 hover:bg-surface-deep hover:border-border-panel-strong transition-all text-left group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white group-hover:text-gold transition-colors">
                        Conversation #{group.conversationId}
                      </h3>
                      <p className="mt-1 text-sm text-muted truncate">
                        {group.latestMemory.summary}
                      </p>
                      <p className="mt-2 text-xs text-text-faint">
                        {group.totalChunks} memory chunk{group.totalChunks !== 1 ? "s" : ""}
                        {type && ` · Type: ${type}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-soft">
                      <p>Latest:</p>
                      <p>{new Date(group.latestMemory.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
