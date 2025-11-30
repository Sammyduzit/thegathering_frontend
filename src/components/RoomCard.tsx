import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";
import type { Room } from "@/types/room";
import GlassPanel from "./ui/GlassPanel";

export type { Room };

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <GlassPanel className="transition-transform hover:-translate-y-1 hover:border-border-panel-strong p-5 md:p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-[0.06em] text-white">{room.name}</h2>
            {room.description && <p className="text-sm text-muted mt-1 max-w-xl leading-relaxed">{room.description}</p>}
          </div>
          {room.has_ai && <span className="badge-ai">AI</span>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.7rem] uppercase tracking-[0.28em] text-muted">
          <span className="px-2 py-1 rounded-full border border-border-mist bg-surface-soft">{room.is_active ? "Open" : "Closed"}</span>
          {room.max_users && <span>Max {room.max_users} souls</span>}
          <span>{formatDateTime(room.created_at)}</span>
          {room.is_translation_enabled && <span className="text-[0.68rem] text-text-aurora">Translations on</span>}
        </div>
      </GlassPanel>
    </Link>
  );
}
