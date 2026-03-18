import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";
import type { Room } from "@/types/room";
import GlassPanel from "./ui/GlassPanel";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  // Derive a stable accent letter from the room name
  const initial = room.name.charAt(0).toUpperCase();

  return (
    <Link href={`/rooms/${room.id}`} className="block group">
      <GlassPanel className="h-full p-5 md:p-6 rounded-2xl hover:border-border-panel-strong hover:-translate-y-1 transition-all duration-200">
        <div className="flex items-start gap-4">
          {/* Room initial badge */}
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-semibold tracking-wider text-gold bg-notice border border-border-panel">
            {initial}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold tracking-[0.05em] text-white group-hover:text-ai transition-colors duration-200 truncate">
                {room.name}
              </h2>
              {room.has_ai && <span className="badge-ai flex-shrink-0">AI</span>}
            </div>

            {room.description && (
              <p className="text-sm text-text-muted mt-1 leading-relaxed line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 pt-4 border-t border-border-mist flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em]">
          <span
            className={`px-2.5 py-1 rounded-full border ${
              room.is_active
                ? "border-border-aurora text-text-aurora bg-aurora-haze"
                : "border-border-mist text-text-faint bg-surface-soft"
            }`}
          >
            {room.is_active ? "Open" : "Closed"}
          </span>
          {room.max_users && (
            <span className="text-text-subtle">
              {room.max_users} souls max
            </span>
          )}
          {room.is_translation_enabled && (
            <span className="text-text-aurora">
              Translations on
            </span>
          )}
          <span className="ml-auto text-text-faint">
            {formatDateTime(room.created_at)}
          </span>
        </div>
      </GlassPanel>
    </Link>
  );
}
