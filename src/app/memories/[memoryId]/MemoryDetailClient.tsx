"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format-date";
import {
  MemoryFormState,
  MemoryResponse,
  memoryToFormState,
  parseImportance,
  parseInteger,
  parseJSON,
  parseKeywords,
  parseOptionalInteger,
  parseOptionalJSON,
} from "@/lib/memories";

type Props = {
  initialMemory: MemoryResponse;
};

export default function MemoryDetailClient({ initialMemory }: Props) {
  const router = useRouter();
  const [memory, setMemory] = useState<MemoryResponse>(initialMemory);
  const [editForm, setEditForm] = useState<MemoryFormState>(memoryToFormState(initialMemory));
  const [showEditForm, setShowEditForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEditForm(memoryToFormState(memory));
  }, [memory]);

  const toggleEditForm = () => {
    setShowEditForm((prev) => {
      const next = !prev;
      if (next) {
        setEditForm(memoryToFormState(memory));
      }
      return next;
    });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setFeedback(null);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};

      if (editForm.summary.trim()) payload.summary = editForm.summary.trim();
      if (editForm.entity_id.trim()) payload.entity_id = parseInteger(editForm.entity_id, "Entity ID");

      payload.conversation_id = parseOptionalInteger(editForm.conversation_id, "Conversation ID");
      payload.room_id = parseOptionalInteger(editForm.room_id, "Room ID");
      payload.memory_content = parseJSON(editForm.memory_content, "Memory content");
      payload.keywords = parseKeywords(editForm.keywords);
      payload.importance_score = parseImportance(editForm.importance_score);
      payload.memory_metadata = parseOptionalJSON(editForm.memory_metadata);

      await apiFetch(`/api/memories/${memory.id}`, {
        method: "PATCH",
        body: payload,
      });

      const { data } = await apiFetch<MemoryResponse>(`/api/memories/${memory.id}`);
      setMemory(data);
      setFeedback("Memory updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (typeof window !== "undefined" && !window.confirm("Delete this memory permanently?")) {
      return;
    }

    setDeleting(true);
    setFeedback(null);
    setError(null);

    try {
      await apiFetch(`/api/memories/${memory.id}`, {
        method: "DELETE",
        expectJson: false,
      });

      router.push("/admin/memories");
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const renderedContent = JSON.stringify(memory.memory_content, null, 2);
  const renderedMetadata = memory.memory_metadata ? JSON.stringify(memory.memory_metadata, null, 2) : null;

  return (
    <div className="space-y-6">
      {(feedback || error) && (
        <div>
          {feedback && (
            <div className="rounded-2xl border border-border-panel border-border-panel-strong bg-notice text-gold">
              {feedback}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-border-panel border-border-rose bg-rose-veil text-text-rose">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted">Memory #{memory.id}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[0.08em] text-white">
            {memory.summary || "(no summary)"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Created {formatDateTime(memory.created_at)} ·{" "}
            {memory.last_accessed ? `Last accessed ${formatDateTime(memory.last_accessed)}` : "Never accessed"}
          </p>
        </div>
        <button
          onClick={toggleEditForm}
          className="rounded bg-gradient-to-r from-[#c8963a] to-[#f5dc97] text-[#0b0f19] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:opacity-90"
        >
          {showEditForm ? "Close editor" : "Edit memory"}
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-border-panel bg-surface-deep p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted">Entity</p>
          <p className="mt-1 text-base text-white">{memory.entity_id}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted">Scope</p>
          <p className="mt-1 text-base text-white">
            {memory.conversation_id !== null
              ? `Conversation ${memory.conversation_id}`
              : memory.room_id !== null
              ? `Room ${memory.room_id}`
              : "Global"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted">Importance</p>
          <p className="mt-1 text-base text-white">{memory.importance_score.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-muted">Keywords</p>
          <p className="mt-1 text-base text-white">{memory.keywords.length ? memory.keywords.join(", ") : "—"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border-panel bg-surface-deep p-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted">Memory content</p>
        <pre className="mt-2 overflow-x-auto rounded-2xl border border-border-panel bg-[#05070f] p-4 text-sm text-white">
          {renderedContent}
        </pre>
      </div>

      <div className="rounded-3xl border border-border-panel bg-surface-deep p-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted">Metadata</p>
        {renderedMetadata ? (
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-border-panel bg-[#05070f] p-4 text-sm text-white">
            {renderedMetadata}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-muted">No metadata provided.</p>
        )}
      </div>

      {showEditForm && (
        <div className="rounded-3xl border border-border-panel bg-surface-deep p-6">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Edit memory</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white" htmlFor="edit-entity">
                  Entity ID
                </label>
                <input
                  id="edit-entity"
                  className="mt-1 w-full input-field text-sm"
                  value={editForm.entity_id}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, entity_id: event.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white" htmlFor="edit-importance">
                  Importance (0–10)
                </label>
                <input
                  id="edit-importance"
                  className="mt-1 w-full input-field text-sm"
                  value={editForm.importance_score}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, importance_score: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white" htmlFor="edit-conversation">
                  Conversation ID
                </label>
                <input
                  id="edit-conversation"
                  className="mt-1 w-full input-field text-sm"
                  value={editForm.conversation_id}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, conversation_id: event.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white" htmlFor="edit-room">
                  Room ID
                </label>
                <input
                  id="edit-room"
                  className="mt-1 w-full input-field text-sm"
                  value={editForm.room_id}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, room_id: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="edit-summary">
                Summary
              </label>
              <textarea
                id="edit-summary"
                className="mt-1 w-full input-field text-sm"
                rows={3}
                value={editForm.summary}
                onChange={(event) => setEditForm((prev) => ({ ...prev, summary: event.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="edit-content">
                Memory content (JSON)
              </label>
              <textarea
                id="edit-content"
                className="mt-1 w-full input-field text-sm font-mono"
                rows={5}
                value={editForm.memory_content}
                onChange={(event) => setEditForm((prev) => ({ ...prev, memory_content: event.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="edit-keywords">
                Keywords
              </label>
              <input
                id="edit-keywords"
                className="mt-1 w-full input-field text-sm"
                value={editForm.keywords}
                onChange={(event) => setEditForm((prev) => ({ ...prev, keywords: event.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="edit-metadata">
                Metadata (JSON)
              </label>
              <textarea
                id="edit-metadata"
                className="mt-1 w-full input-field text-sm font-mono"
                rows={3}
                value={editForm.memory_metadata}
                onChange={(event) => setEditForm((prev) => ({ ...prev, memory_metadata: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUpdate}
                className="rounded bg-gradient-to-r from-[#c8963a] to-[#f5dc97] text-[#0b0f19] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={handleDelete}
                className="rounded-2xl border border-border-panel border-border-rose bg-rose-veil px-4 py-2 text-sm font-semibold text-text-rose hover:bg-opacity-80 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete memory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
