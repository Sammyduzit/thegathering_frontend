"use client";

import { AuroraInput } from "@/components/ui/AuroraInput";
import { AuroraButton } from "@/components/ui/AuroraButton";
import type { ConversationParticipant } from "@/types/conversation";

type ConversationParticipantManagerProps = {
  participants: ConversationParticipant[];
  currentUser: string;
  usernameToAdd: string;
  submitting: boolean;
  canAddParticipant: boolean;
  canManageParticipants: boolean;
  canLeave: boolean;
  isAdmin: boolean;
  onUsernameChange: (value: string) => void;
  onAddParticipant: () => void;
  onRemoveParticipant: (username: string) => void;
};

export function ConversationParticipantManager({
  participants,
  currentUser,
  usernameToAdd,
  submitting,
  canAddParticipant,
  canManageParticipants,
  canLeave,
  isAdmin,
  onUsernameChange,
  onAddParticipant,
  onRemoveParticipant,
}: ConversationParticipantManagerProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Participants</h2>
        <span className="text-[0.68rem] uppercase tracking-[0.3em] text-text-subtle">
          {participants.length} present
        </span>
      </div>

      <div className="star-divider" />

      <div className="flex flex-col gap-3 md:flex-row">
        <AuroraInput
          className="flex-1"
          placeholder="Username or AI name"
          value={usernameToAdd}
          onChange={(e) => onUsernameChange(e.target.value)}
        />
        <AuroraButton
          onClick={onAddParticipant}
          className="text-xs uppercase tracking-[0.28em]"
          disabled={submitting || !canAddParticipant}
        >
          {submitting ? "Submitting..." : "Add"}
        </AuroraButton>
      </div>
      <p className="text-xs text-text-subtle">
        Enter a human username or an AI name. The backend decides whether it is a user or an AI.
      </p>
      {!canAddParticipant && (
        <p className="text-xs text-text-rose">
          You do not have permission to add participants to this conversation.
        </p>
      )}

      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={`${participant.is_ai ? "ai" : "user"}-${participant.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-panel bg-surface-deep px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-white">
                {participant.username}
              </div>
              <div className="mt-1 text-[0.68rem] uppercase tracking-[0.28em] text-text-subtle">
                {isAdmin && (participant.is_ai ? "AI participant" : "Human participant")}
                {isAdmin && <span className="ml-2">·</span>}
                <span className={isAdmin ? "ml-2" : ""}>Status: {participant.status ? participant.status : "—"}</span>
              </div>
              {participant.avatar_url && (
                <div className="mt-1 text-xs text-text-faint">Avatar: {participant.avatar_url}</div>
              )}
            </div>
            <button
              onClick={() => onRemoveParticipant(participant.username)}
              className="inline-flex items-center rounded-full border border-border-rose px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-text-rose hover:bg-rose-veil disabled:opacity-60"
              disabled={
                submitting || (!canManageParticipants && (participant.username !== currentUser || !canLeave))
              }
            >
              Remove
            </button>
          </div>
        ))}
        {participants.length === 0 && (
          <div className="rounded-2xl border border-border-mist bg-surface-soft px-4 py-4 text-center text-xs uppercase tracking-[0.28em] text-text-subtle">
            No participants yet.
          </div>
        )}
      </div>
    </>
  );
}
