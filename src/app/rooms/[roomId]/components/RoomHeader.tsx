import { formatDateTime } from "@/lib/format-date";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import InfoTile from "@/components/ui/InfoTile";
import type { Room, RoomOverviewInfo } from "@/types/room";

type RoomHeaderProps = {
  room: Room;
  overview: RoomOverviewInfo;
  totalParticipants: number;
  isInRoom: boolean;
  joining: boolean;
  selectedStatus: string;
  statusOptions: readonly string[];
  statusSubmitting: boolean;
  statusFeedback: string | null;
  statusError: string | null;
  canUpdateStatus: boolean;
  onJoin: () => void;
  onStatusUpdate: (status: string) => void;
};

export function RoomHeader({
  room,
  overview,
  totalParticipants,
  isInRoom,
  joining,
  selectedStatus,
  statusOptions,
  statusSubmitting,
  statusFeedback,
  statusError,
  canUpdateStatus,
  onJoin,
  onStatusUpdate,
}: RoomHeaderProps) {
  return (
    <GlassPanel as="header" className="rounded-3xl px-6 md:px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex-1 min-w-[260px] space-y-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">{room.name}</h1>
            {room.description && <p className="mt-3 text-muted leading-relaxed">{room.description}</p>}
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoTile title="Status" value={room.is_active ? "Open clearing" : "Closed"} />
            <InfoTile title="Translation" value={room.is_translation_enabled ? "Enabled" : "Disabled"} />
            <InfoTile title="AI presence" value={room.has_ai ? "AI companion on duty" : "No AI assigned"} />
            <InfoTile title="Max users" value={room.max_users ?? "Unlimited"} />
            <InfoTile title="Created" value={formatDateTime(room.created_at)} />
            <InfoTile title="Participants" value={totalParticipants} />
            <InfoTile
              title="Active rooms"
              value={overview.activeRooms ?? "—"}
              subtitle={overview.countMessage}
            />
            <InfoTile
              title="Backend health"
              value={overview.healthStatus ?? "Unknown"}
              subtitle={overview.healthMessage}
            />
          </dl>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <label className="text-xs uppercase tracking-[0.32em] text-text-soft" htmlFor="room-user-status">
            Your status
          </label>
          <select
            id="room-user-status"
            className="rounded-2xl border border-border-aurora bg-surface-soft px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-border-aurora"
            value={selectedStatus}
            onChange={(event) => {
              if (canUpdateStatus) {
                onStatusUpdate(event.target.value);
              }
            }}
            disabled={!canUpdateStatus || statusSubmitting}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {statusFeedback && <p className="text-xs text-text-aurora">{statusFeedback}</p>}
          {statusError && <p className="text-xs text-text-rose">{statusError}</p>}
          {!canUpdateStatus && (
            <p className="text-xs text-text-faint">Join the room to update your status.</p>
          )}
          {isInRoom ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border-aurora bg-aurora-haze px-4 py-2 text-xs uppercase tracking-[0.32em] font-semibold text-text-aurora">
              <span className="w-2 h-2 rounded-full bg-text-aurora animate-pulse" />
              Current Room
            </div>
          ) : (
            <AuroraButton
              onClick={onJoin}
              disabled={joining}
              className="text-xs uppercase tracking-[0.28em]"
            >
              {joining ? "Joining..." : "Join room"}
            </AuroraButton>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
