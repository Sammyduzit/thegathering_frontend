"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/types/room";
import Link from "next/link";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format-date";
import GlassPanel from "../../components/ui/GlassPanel";
import { AuroraButton } from "../../components/ui/AuroraButton";

type Props = {
  room: Room;
  currentRoomId: number | null;
};

export default function JoinRoomClient({ room, currentRoomId }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInRoom = currentRoomId === room.id;

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      await apiFetch(`/api/rooms/${room.id}`, {
        method: "POST",
        expectJson: false,
      });
      router.push(`/rooms/${room.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <GlassPanel className="p-6 md:p-7 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-[0.08em] text-white">{room.name}</h2>
            {room.description && (
              <p className="text-sm text-muted leading-relaxed max-w-xl">{room.description}</p>
            )}
          </div>
          {room.has_ai && <span className="badge-ai">AI</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[0.68rem] uppercase tracking-[0.3em] text-muted">
          <span>{room.is_active ? "Open Clearing" : "Closed"}</span>
          {room.max_users && <span>Max {room.max_users} participants</span>}
          <span>{formatDateTime(room.created_at)}</span>
          {room.is_translation_enabled && <span className="text-text-aurora">Translations on</span>}
        </div>
      </div>
      <div className="star-divider" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {isInRoom ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border-aurora bg-aurora-haze px-4 py-2 text-xs uppercase tracking-[0.32em] font-semibold text-text-aurora">
              <span className="w-2 h-2 rounded-full bg-text-aurora animate-pulse" />
              Current Room
            </div>
          ) : (
            <AuroraButton onClick={handleJoin} disabled={joining} className="disabled:opacity-60 disabled:cursor-not-allowed">
              {joining ? "Joining..." : "Join Room"}
            </AuroraButton>
          )}
          <Link href={`/rooms/${room.id}`} className="link-aurora text-xs uppercase tracking-[0.32em]">
            Enter Clearing
          </Link>
        </div>
      </div>
      {error && (
        <p className="text-xs text-text-rose bg-rose-veil border border-border-panel-strong rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </GlassPanel>
  );
}
