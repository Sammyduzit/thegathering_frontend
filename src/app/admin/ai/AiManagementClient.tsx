"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { getErrorMessage } from "@/types/api-error";
import type {
  AIEntityResponse,
  RoomResponseStrategy,
  ConversationResponseStrategy,
} from "@/types/ai-entity";
import {
  ROOM_RESPONSE_STRATEGY_OPTIONS,
  CONVERSATION_RESPONSE_STRATEGY_OPTIONS,
} from "@/types/ai-entity";
import { formatDateTime } from "@/lib/format-date";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraInput, AuroraTextarea } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";

const getRoomStrategyLabel = (value: RoomResponseStrategy) =>
  ROOM_RESPONSE_STRATEGY_OPTIONS.find((strategy) => strategy.value === value)?.label ?? value;

const getConversationStrategyLabel = (value: ConversationResponseStrategy) =>
  CONVERSATION_RESPONSE_STRATEGY_OPTIONS.find((strategy) => strategy.value === value)?.label ?? value;

type FormState = {
  username: string;
  description: string;
  system_prompt: string;
  model_name: string;
  temperature: string;
  max_tokens: string;
  room_response_strategy: RoomResponseStrategy;
  conversation_response_strategy: ConversationResponseStrategy;
  response_probability: string;
  cooldown_seconds: string;
  config: string;
  avatar_url: string;
  status: "online" | "offline";
  current_room_id: string;
};

type Props = {
  initialEntities: AIEntityResponse[];
};

function entityToFormState(entity: AIEntityResponse): FormState {
  return {
    username: entity.username,
    description: entity.description ?? "",
    system_prompt: entity.system_prompt,
    model_name: entity.model_name,
    temperature: entity.temperature !== null ? String(entity.temperature) : "",
    max_tokens: entity.max_tokens !== null ? String(entity.max_tokens) : "",
    room_response_strategy: entity.room_response_strategy,
    conversation_response_strategy: entity.conversation_response_strategy,
    response_probability: entity.response_probability !== null ? String(entity.response_probability) : "",
    cooldown_seconds: entity.cooldown_seconds !== null ? String(entity.cooldown_seconds) : "",
    config: entity.config ? JSON.stringify(entity.config, null, 2) : "",
    avatar_url: entity.avatar_url ?? "",
    status: entity.status,
    current_room_id: entity.current_room_id !== null ? String(entity.current_room_id) : "",
  };
}

function emptyFormState(): FormState {
  return {
    username: "",
    description: "",
    system_prompt: "",
    model_name: "gpt-4o-mini",
    temperature: "",
    max_tokens: "",
    room_response_strategy: "room_mention_only",
    conversation_response_strategy: "conv_on_questions",
    response_probability: "",
    cooldown_seconds: "",
    config: "",
    avatar_url: "",
    status: "offline",
    current_room_id: "",
  };
}

function parseConfig(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null;
  return JSON.parse(value);
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function parseCooldown(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > 3600) {
    throw new Error("Cooldown must be an integer between 0 and 3600 seconds.");
  }
  return num;
}

function parseResponseProbability(value: string): number {
  if (!value.trim()) {
    throw new Error("Response probability is required for probabilistic room strategy.");
  }

  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 1) {
    throw new Error("Response probability must be between 0 and 1.");
  }
  return Number(num.toFixed(3));
}

export default function AiManagementClient({ initialEntities }: Props) {
  const [entities, setEntities] = useState<AIEntityResponse[]>(initialEntities);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyFormState());
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoomStrategyChange = (value: RoomResponseStrategy) => {
    setCreateForm((prev) => ({
      ...prev,
      room_response_strategy: value,
      response_probability: value === "room_probabilistic" ? prev.response_probability || "0.3" : "",
    }));
  };

  const handleEditRoomStrategyChange = (value: RoomResponseStrategy) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            room_response_strategy: value,
            response_probability: value === "room_probabilistic" ? prev.response_probability || "0.3" : "",
          }
        : prev
    );
  };

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.id === selectedId) ?? null,
    [entities, selectedId]
  );

  const handleSelect = (entity: AIEntityResponse) => {
    setSelectedId(entity.id);
    setEditForm(entityToFormState(entity));
    setFeedback(null);
    setError(null);
  };

  const refreshEntities = async () => {
    const { data } = await apiFetch<AIEntityResponse[]>("/api/ai/entities");
    setEntities(data);
    if (selectedId) {
      const updated = data.find((entity) => entity.id === selectedId);
      if (updated) {
        setEditForm(entityToFormState(updated));
      } else {
        setSelectedId(null);
        setEditForm(null);
      }
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      const responseProbability =
        createForm.room_response_strategy === "room_probabilistic"
          ? parseResponseProbability(createForm.response_probability)
          : undefined;
      const cooldownSeconds = parseCooldown(createForm.cooldown_seconds);

      const payload = {
        username: createForm.username,
        description: createForm.description.trim() || undefined,
        system_prompt: createForm.system_prompt,
        model_name: createForm.model_name,
        temperature: parseNumber(createForm.temperature),
        max_tokens: parseNumber(createForm.max_tokens),
        room_response_strategy: createForm.room_response_strategy,
        conversation_response_strategy: createForm.conversation_response_strategy,
        cooldown_seconds: cooldownSeconds ?? undefined,
        config: parseConfig(createForm.config),
        avatar_url: createForm.avatar_url.trim() || undefined,
      };

      if (!payload.username || !payload.system_prompt || !payload.model_name) {
        throw new Error("Username, system prompt and model are required.");
      }

      if (responseProbability !== undefined) {
        Object.assign(payload, { response_probability: responseProbability });
      }

      await apiFetch("/api/ai/entities", {
        method: "POST",
        body: payload,
      });

      setFeedback("AI created successfully.");
      setCreateForm(emptyFormState());
      setCreateOpen(false);
      await refreshEntities();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEntity || !editForm) return;
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const responseProbability =
        editForm.room_response_strategy === "room_probabilistic"
          ? parseResponseProbability(editForm.response_probability)
          : null;
      const cooldownSeconds = parseCooldown(editForm.cooldown_seconds);
      const nextRoomId = editForm.current_room_id.trim()
        ? Number(editForm.current_room_id)
        : null;
      const roomIdChanged = nextRoomId !== selectedEntity.current_room_id;

      const payload = {
        description: editForm.description.trim() ? editForm.description.trim() : null,
        system_prompt: editForm.system_prompt || undefined,
        model_name: editForm.model_name || undefined,
        temperature: parseNumber(editForm.temperature),
        max_tokens: parseNumber(editForm.max_tokens),
        room_response_strategy: editForm.room_response_strategy,
        conversation_response_strategy: editForm.conversation_response_strategy,
        response_probability: responseProbability,
        cooldown_seconds: cooldownSeconds,
        config: parseConfig(editForm.config),
        avatar_url: editForm.avatar_url.trim() || null,
        status: editForm.status,
        ...(roomIdChanged ? { current_room_id: nextRoomId } : {}),
      };

      await apiFetch(`/api/ai/entities/${selectedEntity.id}`, {
        method: "PATCH",
        body: payload,
      });

      setFeedback("AI updated successfully.");
      await refreshEntities();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntity) return;
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      await apiFetch(`/api/ai/entities/${selectedEntity.id}`, {
        method: "DELETE",
        expectJson: false,
      });
      setFeedback("AI deleted successfully.");
      await refreshEntities();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoodbye = async (entityId: number) => {
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      const { data } = await apiFetch<Record<string, unknown>>(
        `/api/ai/entities/${entityId}/goodbye`,
        { method: "POST" }
      );
      setFeedback(`Goodbye triggered: ${JSON.stringify(data)}`);
      await refreshEntities();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <GlassPanel className="px-7 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Management</h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">Manage AI entities, status and room assignments.</p>
          </div>
          <AuroraButton
            onClick={() => setCreateOpen((prev) => !prev)}
            variant="ghost"
            className="text-xs uppercase tracking-[0.28em]"
          >
            {createOpen ? "Close form" : "Create AI"}
          </AuroraButton>
        </div>
      </GlassPanel>

      {feedback && <AlertStrip variant="notice">{feedback}</AlertStrip>}
      {error && <AlertStrip variant="danger">{error}</AlertStrip>}

      {createOpen && (
        <GlassPanel className="px-7 py-6 space-y-6">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Create AI</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <AuroraInput
              label="Username *"
              value={createForm.username}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
            />
            <div className="md:col-span-2">
              <AuroraTextarea
                label="Description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <AuroraTextarea
                label="System prompt *"
                rows={4}
                value={createForm.system_prompt}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, system_prompt: e.target.value }))}
              />
            </div>
            <AuroraInput
              label="Model *"
              value={createForm.model_name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, model_name: e.target.value }))}
            />
            <AuroraInput
              label="Temperature"
              type="number"
              step="0.1"
              value={createForm.temperature}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, temperature: e.target.value }))}
            />
            <AuroraInput
              label="Max tokens"
              type="number"
              value={createForm.max_tokens}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, max_tokens: e.target.value }))}
            />
            <div>
              <label className="block text-xs uppercase tracking-[0.32em] text-text-soft">
                Room response strategy
              </label>
              <select
                className="input-field mt-2"
                value={createForm.room_response_strategy}
                onChange={(e) => handleCreateRoomStrategyChange(e.target.value as RoomResponseStrategy)}
              >
                {ROOM_RESPONSE_STRATEGY_OPTIONS.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[0.65rem] text-text-faint">
                {ROOM_RESPONSE_STRATEGY_OPTIONS.find((strategy) => strategy.value === createForm.room_response_strategy)?.description}
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.32em] text-text-soft">
                Conversation response strategy
              </label>
              <select
                className="input-field mt-2"
                value={createForm.conversation_response_strategy}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    conversation_response_strategy: e.target.value as ConversationResponseStrategy,
                  }))
                }
              >
                {CONVERSATION_RESPONSE_STRATEGY_OPTIONS.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[0.65rem] text-text-faint">
                {
                  CONVERSATION_RESPONSE_STRATEGY_OPTIONS.find(
                    (strategy) => strategy.value === createForm.conversation_response_strategy
                  )?.description
                }
              </p>
            </div>
            {createForm.room_response_strategy === "room_probabilistic" && (
              <AuroraInput
                label="Response probability (0-1)"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={createForm.response_probability}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, response_probability: e.target.value }))}
              />
            )}
            <AuroraInput
              label="Cooldown (seconds)"
              type="number"
              min="0"
              max="3600"
              value={createForm.cooldown_seconds}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, cooldown_seconds: e.target.value }))}
            />
            <div className="md:col-span-2">
              <AuroraTextarea
                label="Config (JSON)"
                rows={4}
                value={createForm.config}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, config: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <AuroraInput
                label="Avatar URL (optional)"
                value={createForm.avatar_url}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="https://... (leave empty for auto-generated DiceBear avatar)"
              />
              <p className="mt-2 text-xs text-text-faint">
                Leave empty to auto-generate a DiceBear &quot;bottts&quot; style avatar based on username
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <AuroraButton
              onClick={() => setCreateOpen(false)}
              variant="ghost"
              disabled={isSubmitting}
              className="text-xs uppercase tracking-[0.28em]"
            >
              Cancel
            </AuroraButton>
            <AuroraButton
              onClick={handleCreate}
              disabled={isSubmitting}
              className="text-xs uppercase tracking-[0.28em]"
            >
              {isSubmitting ? "Saving..." : "Create AI"}
            </AuroraButton>
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-muted">
            <thead className="bg-panel-hover text-[0.65rem] uppercase tracking-[0.28em] text-text-soft">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Name</th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-left font-semibold">Model</th>
                <th className="px-5 py-4 text-left font-semibold">Behaviour</th>
                <th className="px-5 py-4 text-left font-semibold">Room</th>
                <th className="px-5 py-4 text-left font-semibold">Last update</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-t border-border-panel hover:bg-surface-deep transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {entity.avatar_url && (
                        <img
                          src={entity.avatar_url}
                          alt={`${entity.username}'s avatar`}
                          className="w-10 h-10 rounded-full border border-border-panel flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.username)}&background=1a1f35&color=8b9dc3&size=40`;
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white flex items-center gap-2">
                          {entity.username}
                          {!entity.is_active && (
                            <span className="rounded-full border border-border-rose px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-text-rose">
                              Archived
                            </span>
                          )}
                        </div>
                        {entity.description && (
                          <p className="mt-1 text-xs text-text-faint">{entity.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] font-semibold ${
                        entity.status === "online"
                          ? "bg-aurora-haze border border-border-aurora text-text-aurora"
                          : "bg-surface-soft border border-border-mist text-text-soft"
                      }`}
                    >
                      {entity.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{entity.model_name}</div>
                    {entity.temperature !== null && (
                      <div className="text-xs text-text-subtle">Temp: {entity.temperature}</div>
                    )}
                    {entity.max_tokens !== null && (
                      <div className="text-xs text-text-subtle">Max: {entity.max_tokens}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div>Room: <span className="text-white">{getRoomStrategyLabel(entity.room_response_strategy)}</span></div>
                    <div>Conversation: <span className="text-white">{getConversationStrategyLabel(entity.conversation_response_strategy)}</span></div>
                    {entity.response_probability !== null && (
                      <div>Probability: {entity.response_probability}</div>
                    )}
                    {entity.cooldown_seconds !== null && (
                      <div>Cooldown: {entity.cooldown_seconds}s</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {entity.current_room_id
                      ? entity.current_room_name
                        ? `${entity.current_room_name} (#${entity.current_room_id})`
                        : `Room #${entity.current_room_id}`
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-text-faint">
                    {entity.updated_at ? formatDateTime(entity.updated_at) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSelect(entity)}
                        className="rounded-full border border-border-panel-strong px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] font-semibold text-gold hover:bg-notice transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleGoodbye(entity.id)}
                        className="rounded-full border border-border-aurora px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] font-semibold text-text-aurora hover:bg-aurora-haze transition-colors disabled:opacity-60"
                        disabled={isSubmitting}
                      >
                        Goodbye
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-text-soft uppercase tracking-[0.28em]">
                    No AI entities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {selectedEntity && editForm && (
        <GlassPanel className="px-7 py-6 space-y-6">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Edit AI: {selectedEntity.username}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <AuroraInput
              label="Username"
              value={editForm.username}
              disabled
            />
            <p className="text-xs text-text-faint col-span-2">The username cannot be changed.</p>
            <div className="md:col-span-2">
              <AuroraTextarea
                label="Description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, description: e.target.value } : prev)}
              />
            </div>
            <div className="md:col-span-2">
              <AuroraTextarea
                label="System prompt"
                rows={4}
                value={editForm.system_prompt}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, system_prompt: e.target.value } : prev)}
              />
            </div>
            <AuroraInput
              label="Model"
              value={editForm.model_name}
              onChange={(e) => setEditForm((prev) => prev ? { ...prev, model_name: e.target.value } : prev)}
            />
            <AuroraInput
              label="Temperature"
              type="number"
              step="0.1"
              value={editForm.temperature}
              onChange={(e) => setEditForm((prev) => prev ? { ...prev, temperature: e.target.value } : prev)}
            />
            <AuroraInput
              label="Max tokens"
              type="number"
              value={editForm.max_tokens}
              onChange={(e) => setEditForm((prev) => prev ? { ...prev, max_tokens: e.target.value } : prev)}
            />
            <div>
              <label className="block text-xs uppercase tracking-[0.32em] text-text-soft">
                Room response strategy
              </label>
              <select
                className="input-field mt-2"
                value={editForm.room_response_strategy}
                onChange={(e) => handleEditRoomStrategyChange(e.target.value as RoomResponseStrategy)}
              >
                {ROOM_RESPONSE_STRATEGY_OPTIONS.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[0.65rem] text-text-faint">
                {ROOM_RESPONSE_STRATEGY_OPTIONS.find((strategy) => strategy.value === editForm.room_response_strategy)?.description}
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.32em] text-text-soft">
                Conversation response strategy
              </label>
              <select
                className="input-field mt-2"
                value={editForm.conversation_response_strategy}
                onChange={(e) => setEditForm((prev) => prev ? {
                  ...prev,
                  conversation_response_strategy: e.target.value as ConversationResponseStrategy,
                } : prev)}
              >
                {CONVERSATION_RESPONSE_STRATEGY_OPTIONS.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[0.65rem] text-text-faint">
                {
                  CONVERSATION_RESPONSE_STRATEGY_OPTIONS.find(
                    (strategy) => strategy.value === editForm.conversation_response_strategy
                  )?.description
                }
              </p>
            </div>
            {editForm.room_response_strategy === "room_probabilistic" && (
              <AuroraInput
                label="Response probability (0-1)"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={editForm.response_probability}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, response_probability: e.target.value } : prev)}
              />
            )}
            <AuroraInput
              label="Cooldown (seconds)"
              type="number"
              min="0"
              max="3600"
              value={editForm.cooldown_seconds}
              onChange={(e) => setEditForm((prev) => prev ? { ...prev, cooldown_seconds: e.target.value } : prev)}
            />
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.32em] text-text-soft">
                Status
              </label>
              <select
                className="input-field w-full"
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, status: e.target.value as "online" | "offline" } : prev)}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <AuroraInput
              label="Room ID"
              type="number"
              value={editForm.current_room_id}
              onChange={(e) => setEditForm((prev) => prev ? { ...prev, current_room_id: e.target.value } : prev)}
            />
            <div className="text-xs text-text-faint col-span-2 space-y-1">
              <p>Leave empty to remove the AI from the room.</p>
              {selectedEntity.current_room_name && (
                <p>Currently assigned to: {selectedEntity.current_room_name} (#{selectedEntity.current_room_id})</p>
              )}
            </div>

            <div className="md:col-span-2">
              <AuroraTextarea
                label="Config (JSON)"
                rows={4}
                value={editForm.config}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, config: e.target.value } : prev)}
              />
            </div>
            <div className="md:col-span-2">
              <AuroraInput
                label="Avatar URL (optional)"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, avatar_url: e.target.value } : prev)}
                placeholder="https://... (leave empty for auto-generated DiceBear avatar)"
              />
              <p className="mt-2 text-xs text-text-faint">
                Leave empty to auto-generate a DiceBear &quot;bottts&quot; style avatar based on username
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AuroraButton
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="text-xs uppercase tracking-[0.28em]"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </AuroraButton>
            <button
              onClick={() => handleGoodbye(selectedEntity.id)}
              className="rounded-full border border-border-aurora bg-aurora-haze px-4 py-2 text-xs uppercase tracking-[0.28em] font-semibold text-text-aurora hover:bg-opacity-80 transition-colors disabled:opacity-60"
              disabled={isSubmitting}
            >
              Initiate Goodbye
            </button>
            <button
              onClick={handleDelete}
              className="rounded-full border border-border-rose bg-rose-veil px-4 py-2 text-xs uppercase tracking-[0.28em] font-semibold text-text-rose hover:bg-opacity-80 transition-colors disabled:opacity-60"
              disabled={isSubmitting}
            >
              Delete AI
            </button>
          </div>
        </GlassPanel>
      )}
    </main>
  );
}
