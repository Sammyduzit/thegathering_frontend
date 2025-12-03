"use client";

import { formatDateTime } from "@/lib/format-date";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton, AuroraLinkButton } from "@/components/ui/AuroraButton";

type ConversationHeaderProps = {
  id: number;
  roomName: string | null;
  type: string;
  roomId: number | null;
  createdAt: string;
  participantCount: number;
  messageCount: number;
  isActive: boolean;
  isArchiving: boolean;
  canArchive: boolean;
  onArchiveToggle: () => void;
};

export function ConversationHeader({
  id,
  roomName,
  type,
  roomId,
  createdAt,
  participantCount,
  messageCount,
  isActive,
  isArchiving,
  canArchive,
  onArchiveToggle,
}: ConversationHeaderProps) {
  return (
    <GlassPanel as="header" className="rounded-3xl px-6 md:px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
            {roomName ?? `Conversation #${id}`}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-muted leading-relaxed">
              Type: {type}. Room ID: {roomId ?? "–"}. Created {formatDateTime(createdAt)}.
            </p>
            {roomId && (
              <AuroraLinkButton
                href={`/rooms/${roomId}`}
                variant="ghost"
                className="text-[0.65rem]"
              >
                Go to Room
              </AuroraLinkButton>
            )}
          </div>
          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.3em] text-text-soft">
            Participants: {participantCount} · Messages: {messageCount}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] ${
              isActive
                ? "border-border-aurora text-text-aurora"
                : "border-border-panel-strong text-gold"
            }`}
          >
            {isActive ? "Active" : "Archived"}
          </span>
          <AuroraButton
            onClick={onArchiveToggle}
            variant="ghost"
            className="text-[0.6rem]"
            disabled={isArchiving || !canArchive}
          >
            {isArchiving ? "Deleting..." : isActive ? "Delete conversation" : "Restore conversation"}
          </AuroraButton>
          {!canArchive && (
            <span className="text-[0.6rem] text-text-faint">
              Only participants can delete or restore this conversation.
            </span>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
