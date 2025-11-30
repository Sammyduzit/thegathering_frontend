"use client";

import { useMemo, useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraInput, AuroraTextarea } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";

type Room = {
  id: number;
  name: string;
  description: string | null;
  max_users: number | null;
  is_translation_enabled: boolean;
  is_active: boolean;
  has_ai: boolean;
  created_at: string;
};

type RoomFormState = {
  name: string;
  description: string;
  max_users: string;
  is_translation_enabled: boolean;
};

type Props = {
  initialRooms: Room[];
};

function roomToFormState(room: Room): RoomFormState {
  return {
    name: room.name,
    description: room.description ?? "",
    max_users: room.max_users !== null ? String(room.max_users) : "",
    is_translation_enabled: room.is_translation_enabled,
  };
}

function emptyFormState(): RoomFormState {
  return {
    name: "",
    description: "",
    max_users: "",
    is_translation_enabled: false,
  };
}

function parseMaxUsers(value: string): number | null {
  if (!value.trim()) return null;
  const max = Number(value);
  if (Number.isNaN(max) || max < 0) {
    throw new Error("Max users must be a positive number.");
  }
  return max;
}

export default function RoomManagementClient({ initialRooms }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(initialRooms[0]?.id ?? null);
  const [createForm, setCreateForm] = useState<RoomFormState>(emptyFormState());
  const [editForm, setEditForm] = useState<RoomFormState | null>(
    initialRooms[0] ? roomToFormState(initialRooms[0]) : null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const refreshRooms = async () => {
    const { data } = await apiFetch<Room[]>("/api/rooms");
    setRooms(data);
    if (selectedRoomId) {
      const updated = data.find((room) => room.id === selectedRoomId);
      if (updated) {
        setEditForm(roomToFormState(updated));
      } else if (data.length > 0) {
        setSelectedRoomId(data[0].id);
        setEditForm(roomToFormState(data[0]));
      } else {
        setSelectedRoomId(null);
        setEditForm(null);
      }
    }
  };

  const handleSelect = (room: Room) => {
    setSelectedRoomId(room.id);
    setEditForm(roomToFormState(room));
    setFeedback(null);
    setError(null);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      if (!createForm.name.trim()) {
        throw new Error("Room name is required.");
      }

      const payload = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        max_users: parseMaxUsers(createForm.max_users),
        is_translation_enabled: createForm.is_translation_enabled,
      };

      await apiFetch("/api/rooms", {
        method: "POST",
        body: payload,
      });

      setFeedback(`Room "${payload.name}" created successfully.`);
      setCreateForm(emptyFormState());
      await refreshRooms();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRoom || !editForm) return;

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      if (!editForm.name.trim()) {
        throw new Error("Room name is required.");
      }

      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        max_users: parseMaxUsers(editForm.max_users),
        is_translation_enabled: editForm.is_translation_enabled,
      };

      await apiFetch(`/api/rooms/${selectedRoom.id}`, {
        method: "PUT",
        body: payload,
      });

      setFeedback(`Room "${payload.name}" updated successfully.`);
      await refreshRooms();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      await apiFetch(`/api/rooms/${selectedRoom.id}`, {
        method: "DELETE",
        expectJson: false,
      });

      setFeedback(`Room "${selectedRoom.name}" closed successfully.`);
      await refreshRooms();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <GlassPanel className="px-7 py-6">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room Management</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">Create and manage gathering spaces.</p>
      </GlassPanel>

      {feedback && <AlertStrip variant="notice">{feedback}</AlertStrip>}
      {error && <AlertStrip variant="danger">{error}</AlertStrip>}

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassPanel className="px-6 py-6 space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Existing rooms</h2>
          <p className="text-sm text-muted">Select a room to view and edit its configuration.</p>
          <div className="space-y-3">
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-border-aurora bg-aurora-haze"
                      : "border-border-panel bg-surface-deep hover:bg-surface-soft"
                  }`}
                  onClick={() => handleSelect(room)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{room.name}</span>
                    <span
                      className={`text-[0.6rem] uppercase tracking-[0.3em] ${
                        room.is_active ? "text-text-aurora" : "text-text-soft"
                      }`}
                    >
                      {room.is_active ? "Active" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-subtle">
                    Max: {room.max_users ?? "∞"} · Translation: {room.is_translation_enabled ? "On" : "Off"} · AI:{" "}
                    {room.has_ai ? "Yes" : "No"}
                  </p>
                </button>
              );
            })}
            {rooms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-mist px-4 py-4 text-center text-xs text-text-soft uppercase tracking-[0.28em]">
                No rooms created yet.
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel className="px-6 py-6 space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Create room</h2>
          <div className="space-y-4">
            <AuroraInput
              label="Name *"
              id="create-name"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <AuroraTextarea
              label="Description"
              id="create-description"
              rows={3}
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <AuroraInput
              label="Max users"
              id="create-max-users"
              value={createForm.max_users}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, max_users: event.target.value }))}
              placeholder="Leave empty for unlimited"
            />
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border-aurora bg-surface-soft focus:ring-2 focus:ring-border-aurora"
                checked={createForm.is_translation_enabled}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, is_translation_enabled: event.target.checked }))
                }
              />
              Translation enabled
            </label>
            <AuroraButton
              onClick={handleCreate}
              disabled={submitting}
              className="w-full justify-center text-xs uppercase tracking-[0.28em]"
            >
              {submitting ? "Working..." : "Create room"}
            </AuroraButton>
          </div>
        </GlassPanel>

        <GlassPanel className="px-6 py-6 space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Edit room</h2>
          {selectedRoom && editForm ? (
            <div className="space-y-4">
              <AuroraInput
                label="Name *"
                id="edit-name"
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => prev && ({ ...prev, name: event.target.value }))}
              />
              <AuroraTextarea
                label="Description"
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(event) => setEditForm((prev) => prev && ({ ...prev, description: event.target.value }))}
              />
              <AuroraInput
                label="Max users"
                id="edit-max-users"
                value={editForm.max_users}
                onChange={(event) => setEditForm((prev) => prev && ({ ...prev, max_users: event.target.value }))}
                placeholder="Leave empty for unlimited"
              />
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border-aurora bg-surface-soft focus:ring-2 focus:ring-border-aurora"
                  checked={editForm.is_translation_enabled}
                  onChange={(event) =>
                    setEditForm((prev) => prev && ({ ...prev, is_translation_enabled: event.target.checked }))
                  }
                />
                Translation enabled
              </label>
              <div className="flex flex-wrap gap-3">
                <AuroraButton
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="text-xs uppercase tracking-[0.28em]"
                >
                  {submitting ? "Working..." : "Save changes"}
                </AuroraButton>
                <button
                  onClick={handleDelete}
                  className="rounded-full border border-border-rose bg-rose-veil px-4 py-2 text-xs uppercase tracking-[0.28em] font-semibold text-text-rose hover:bg-opacity-80 transition-colors disabled:opacity-60"
                  disabled={submitting}
                >
                  Close room
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-soft">Select a room to view and edit its settings.</p>
          )}
        </GlassPanel>
      </div>
    </main>
  );
}
