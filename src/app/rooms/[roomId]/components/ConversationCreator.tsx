import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import TogglePill from "@/components/ui/TogglePill";
import type { SelectableParticipant } from "../hooks/useRoomParticipants";

type ConversationType = "private" | "group";

type ConversationCreatorProps = {
  isInRoom: boolean;
  conversationMode: ConversationType | null;
  selectedUsers: string[];
  selectableParticipants: SelectableParticipant[];
  creatingConversation: boolean;
  canSubmitConversation: boolean;
  isPrivate: boolean;
  onToggleMode: (mode: ConversationType) => void;
  onToggleUser: (username: string) => void;
  onCreate: () => void;
  onCancel: () => void;
};

export function ConversationCreator({
  isInRoom,
  conversationMode,
  selectedUsers,
  selectableParticipants,
  creatingConversation,
  canSubmitConversation,
  isPrivate,
  onToggleMode,
  onToggleUser,
  onCreate,
  onCancel,
}: ConversationCreatorProps) {
  return (
    <GlassPanel as="section" className="rounded-3xl px-6 md:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Start a conversation</h2>
        <span className="text-[0.68rem] uppercase tracking-[0.3em] text-text-subtle">
          Choose the type and select participants from the room.
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <TogglePill
          onClick={() => onToggleMode("private")}
          disabled={!isInRoom}
          active={conversationMode === "private"}
          tone="aurora"
        >
          Start private conversation
        </TogglePill>
        <TogglePill
          onClick={() => onToggleMode("group")}
          disabled={!isInRoom}
          active={conversationMode === "group"}
          tone="gold"
        >
          Start group conversation
        </TogglePill>
      </div>

      {!isInRoom && <p className="text-xs text-text-subtle">Join the room to create conversations.</p>}

      {conversationMode && (
        <div className="rounded-2xl border border-border-panel bg-surface-deep px-4 py-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {conversationMode === "private"
              ? "Select exactly one participant"
              : "Select one or more participants"}
          </h3>
          <ul className="space-y-2">
            {selectableParticipants.map((participant) => {
              const selected = selectedUsers.includes(participant.username);
              return (
                <li
                  key={`${participant.isAi ? "ai" : "user"}-${participant.username}`}
                  className="flex items-center gap-3 rounded-2xl border border-border-mist bg-surface-soft px-3 py-2 text-sm text-white"
                >
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type={isPrivate ? "radio" : "checkbox"}
                      checked={selected}
                      onChange={() => onToggleUser(participant.username)}
                      disabled={creatingConversation}
                    />
                    <span>
                      <span className="font-medium text-white">{participant.label}</span>
                      <span className="block text-xs text-text-subtle">
                        {participant.isAi ? "AI participant" : `Status: ${participant.status ?? "—"}`}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
            {selectableParticipants.length === 0 && (
              <li className="rounded-2xl border border-border-mist px-3 py-2 text-xs text-text-subtle">
                No available participants in this room.
              </li>
            )}
          </ul>
          <div className="flex justify-end gap-3">
            <AuroraButton onClick={onCancel} variant="ghost" className="text-[0.65rem]" disabled={creatingConversation}>
              Cancel
            </AuroraButton>
            <AuroraButton
              onClick={onCreate}
              disabled={!canSubmitConversation || creatingConversation}
              className="text-xs uppercase tracking-[0.28em]"
            >
              {creatingConversation ? "Creating..." : "Create conversation"}
            </AuroraButton>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
