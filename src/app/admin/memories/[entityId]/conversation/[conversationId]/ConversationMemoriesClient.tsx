"use client";

import { useState, useMemo } from "react";
import type { AIEntityResponse } from "@/types/ai-entity";
import type { ConversationDetail } from "@/types/conversation";
import type {
  MemoryListResponse,
  MemoryResponse,
  MemoryCreateRequest,
  MemoryUpdateRequest,
} from "@/lib/memories";
import { createMemory, updateMemory, deleteMemory, MEMORY_CONFIG } from "@/lib/memories";
import { getErrorMessage } from "@/types/api-error";
import { apiFetch } from "@/lib/client-api";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraTextarea } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";
import { formatDateTime } from "@/lib/format-date";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useMemoryModal } from "./useMemoryModal";

type Props = {
  entity: AIEntityResponse;
  conversation: ConversationDetail;
  initialMemories: MemoryListResponse;
};

export default function ConversationMemoriesClient({
  entity,
  conversation,
  initialMemories,
}: Props) {
  const modal = useMemoryModal();
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryResponse[]>(initialMemories.memories);

  // Extract user_ids from conversation participants (non-AI only)
  const userIds = useMemo(() => {
    return conversation.participants.filter((p) => !p.is_ai).map((p) => p.id);
  }, [conversation.participants]);

  // Sort memories by ID
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => a.id - b.id);
  }, [memories]);

  // Function to reload memories from API
  const reloadMemories = async () => {
    try {
      setRefreshing(true);
      const { data } = await apiFetch<MemoryListResponse>(
        `/api/memories/?entity_id=${entity.id}&conversation_id=${conversation.id}`
      );
      setMemories(data.memories);
    } catch (err) {
      console.error("Failed to reload memories:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const text = modal.formText.trim();
      if (!text) {
        throw new Error("Memory text is required.");
      }

      if (text.length > MEMORY_CONFIG.MEMORY_TEXT_LENGTH) {
        throw new Error(`Memory text must be ${MEMORY_CONFIG.MEMORY_TEXT_LENGTH} characters or less.`);
      }

      const keywords = modal.formKeywords.trim()
        ? modal.formKeywords.split(",").map((k) => k.trim()).filter(Boolean)
        : undefined;

      const request: MemoryCreateRequest = {
        entity_id: entity.id,
        conversation_id: conversation.id,
        user_ids: userIds,
        text,
        keywords,
      };

      await createMemory(request);

      setFeedback("Memory created successfully!");
      modal.closeModal();
      await reloadMemories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.selectedMemory) return;

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const text = modal.formText.trim();
      if (!text) {
        throw new Error("Memory text is required.");
      }

      if (text.length > MEMORY_CONFIG.MEMORY_TEXT_LENGTH) {
        throw new Error(`Memory text must be ${MEMORY_CONFIG.MEMORY_TEXT_LENGTH} characters or less.`);
      }

      const keywords = modal.formKeywords.trim()
        ? modal.formKeywords.split(",").map((k) => k.trim()).filter(Boolean)
        : undefined;

      const update: MemoryUpdateRequest = {
        text,
        keywords,
      };

      await updateMemory(modal.selectedMemory.id, update);

      setFeedback("Memory updated successfully!");
      modal.closeModal();
      await reloadMemories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memory: MemoryResponse) => {
    if (!confirm(`Delete memory #${memory.id}? This cannot be undone.`)) {
      return;
    }

    setFeedback(null);
    setError(null);

    try {
      await deleteMemory(memory.id);
      setFeedback("Memory deleted successfully!");
      await reloadMemories();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getChunkIndex = (memory: MemoryResponse): number | null => {
    const metadata = memory.memory_metadata as Record<string, unknown> | null;
    return metadata?.chunk_index !== undefined ? (metadata.chunk_index as number) : null;
  };

  const getTotalChunks = (memory: MemoryResponse): number | null => {
    const metadata = memory.memory_metadata as Record<string, unknown> | null;
    return metadata?.total_chunks !== undefined ? (metadata.total_chunks as number) : null;
  };

  return (
    <div className="space-y-6">
      {(feedback || error) && (
        <div className="space-y-2">
          {feedback && <AlertStrip variant="notice">{feedback}</AlertStrip>}
          {error && <AlertStrip variant="danger">{error}</AlertStrip>}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">
          {sortedMemories.length} memory chunk{sortedMemories.length !== 1 ? "s" : ""}
        </p>
        <AuroraButton
          onClick={modal.openAddModal}
          className="text-xs uppercase tracking-[0.28em]"
        >
          + Add Memory
        </AuroraButton>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-border-panel bg-surface-soft p-4">
        <p className="text-xs text-muted">
          <strong className="text-white">Format:</strong> Use double newlines between messages:{" "}
          <code className="text-text-aurora">username: message\n\nusername: reply</code>
        </p>
        <p className="text-xs text-muted mt-2">
          <strong className="text-white">Limit:</strong> Max {MEMORY_CONFIG.MEMORY_TEXT_LENGTH}{" "}
          characters per memory chunk.
        </p>
        <p className="text-xs text-muted mt-2">
          <strong className="text-white">User IDs:</strong> Automatically set to{" "}
          {userIds.length > 0 ? userIds.join(", ") : "none"} (non-AI participants).
        </p>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {refreshing ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : sortedMemories.length === 0 ? (
          <p className="text-sm text-text-soft text-center py-8">
            No memories found for this conversation. Add one above!
          </p>
        ) : null}

        {!refreshing && sortedMemories.map((memory) => {
          const chunkIndex = getChunkIndex(memory);
          const totalChunks = getTotalChunks(memory);

          return (
            <div
              key={memory.id}
              className="rounded-2xl border border-border-panel bg-surface-soft p-5 hover:bg-surface-deep transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Chunk info */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-panel-hover border border-border-panel text-[0.65rem] uppercase tracking-[0.28em] text-text-soft font-semibold">
                      Chunk {chunkIndex !== null ? chunkIndex + 1 : "?"}{totalChunks !== null ? ` / ${totalChunks}` : ""}
                    </span>
                    <span className="text-xs text-text-faint">ID: {memory.id}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-white font-medium">{memory.summary}</p>

                  {/* Memory Content */}
                  <div className="mt-3 p-3 rounded-lg bg-panel-hover border border-border-panel">
                    {(() => {
                      const content = memory.memory_content as Record<string, unknown>;
                      const metadata = memory.memory_metadata as { type?: string } | null;

                      // Fact-based LTM (automatically created during conversation archive)
                      if (metadata?.type === "long_term" && content.fact && typeof content.fact === "object") {
                        const fact = content.fact as {
                          text: string;
                          theme: string;
                          participants: string[];
                          importance: number;
                        };
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="text-white"><strong>Fact:</strong> {fact.text}</p>
                            <p className="text-muted">Theme: {fact.theme}</p>
                            <p className="text-muted">Participants: {fact.participants.join(", ")}</p>
                            {content.message_range && (
                              <p className="text-muted">Message Range: {String(content.message_range)}</p>
                            )}
                          </div>
                        );
                      }

                      // Text-based LTM (manually created)
                      if ((metadata?.type === "long_term" || metadata?.type === "personality") && content.full_text && typeof content.full_text === "string") {
                        return (
                          <pre className="text-xs text-muted whitespace-pre-wrap font-mono">
                            {content.full_text}
                          </pre>
                        );
                      }

                      // Fallback (should not occur)
                      return <p className="text-xs text-text-faint">Content not available</p>;
                    })()}
                  </div>

                  {/* Keywords */}
                  {memory.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memory.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-aurora-haze border border-border-aurora text-[0.6rem] uppercase tracking-[0.24em] text-text-aurora"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-text-faint space-y-1">
                    <p>Importance: {memory.importance_score.toFixed(1)}</p>
                    <p>Created: {formatDateTime(memory.created_at)}</p>
                    {memory.last_accessed && (
                      <p>Last accessed: {formatDateTime(memory.last_accessed)} ({memory.access_count}x)</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => modal.openEditModal(memory)}
                    className="rounded-full border border-border-panel-strong px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] font-semibold text-gold hover:bg-notice transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(memory)}
                    className="rounded-full border border-border-rose px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] font-semibold text-text-rose hover:bg-rose-veil transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add/Edit */}
      {modal.modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border-panel bg-[#111424] p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold tracking-[0.08em] text-white mb-6">
              {modal.modalMode === "add" ? "Add Memory" : "Edit Memory"}
            </h2>

            {error && (
              <div className="mb-4">
                <AlertStrip variant="danger">{error}</AlertStrip>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2" htmlFor="memory-text">
                  Memory Text *
                </label>
                <AuroraTextarea
                  id="memory-text"
                  rows={10}
                  placeholder="username: message&#10;&#10;username: reply&#10;&#10;username: another message"
                  value={modal.formText}
                  onChange={(e) => modal.setFormText(e.target.value)}
                  disabled={submitting}
                />
                <p className="mt-2 text-xs text-text-faint">
                  {modal.formText.length} / {MEMORY_CONFIG.MEMORY_TEXT_LENGTH} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2" htmlFor="keywords">
                  Keywords (comma-separated, optional)
                </label>
                <input
                  id="keywords"
                  type="text"
                  className="input-field w-full"
                  placeholder="keyword1, keyword2, keyword3"
                  value={modal.formKeywords}
                  onChange={(e) => modal.setFormKeywords(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="rounded-2xl border border-border-panel bg-panel-hover p-4 text-xs text-muted space-y-1">
                <p>
                  <strong className="text-white">Entity ID:</strong> {entity.id}
                </p>
                <p>
                  <strong className="text-white">Conversation ID:</strong> {conversation.id}
                </p>
                <p>
                  <strong className="text-white">User IDs:</strong>{" "}
                  {userIds.length > 0 ? userIds.join(", ") : "None (no human participants)"}
                </p>
                <p className="text-text-faint mt-2">
                  Keywords are auto-extracted if not provided. Embedding is generated automatically.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <AuroraButton
                onClick={modal.closeModal}
                variant="ghost"
                disabled={submitting}
                className="text-xs uppercase tracking-[0.28em]"
              >
                Cancel
              </AuroraButton>
              <AuroraButton
                onClick={modal.modalMode === "add" ? handleCreate : handleUpdate}
                disabled={submitting || !modal.formText.trim()}
                className="text-xs uppercase tracking-[0.28em]"
              >
                {submitting ? "Saving..." : modal.modalMode === "add" ? "Create" : "Update"}
              </AuroraButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
