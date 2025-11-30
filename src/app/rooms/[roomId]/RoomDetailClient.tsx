"use client";

import { useState, useEffect } from "react";
import { useRoomParticipants } from "./hooks/useRoomParticipants";
import { useRoomStatus } from "./hooks/useRoomStatus";
import { useRoomMessages } from "./hooks/useRoomMessages";
import { useConversationCreator } from "./hooks/useConversationCreator";
import { useRoomJoin } from "./hooks/useRoomJoin";
import { RoomHeader } from "./components/RoomHeader";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";
import { ConversationCreator } from "./components/ConversationCreator";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import AlertStrip from "@/components/ui/AlertStrip";
import { apiFetch } from "@/lib/client-api";
import type { UserResponse } from "@/types/user";
import type {
  Room,
  RoomOverviewInfo,
  RoomMessage,
  RoomParticipantsResponse,
  RoomParticipant,
} from "@/types/room";
import type { PaginationState } from "@/lib/room-chat-helpers";

type Props = {
  room: Room;
  participants: RoomParticipantsResponse | null;
  currentRoomId: number | null;
  currentUsername: string;
  overview: RoomOverviewInfo;
  initialMessages: RoomMessage[];
  initialPagination: PaginationState;
  messagesError: string | null;
};

export default function RoomDetailClient({
  room,
  participants,
  currentRoomId,
  currentUsername,
  overview,
  initialMessages,
  initialPagination,
  messagesError,
}: Props) {
  const isInRoom = currentRoomId === room.id;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    apiFetch<UserResponse>("/api/me")
      .then((user) => setIsAdmin(user.is_admin))
      .catch(() => setIsAdmin(false));
  }, []);

  const participantsData = useRoomParticipants({
    participants,
    currentUsername,
  });

  const status = useRoomStatus({
    currentParticipant: participantsData.currentParticipant,
  });

  const messages = useRoomMessages({
    roomId: room.id,
    isInRoom,
    isRoomActive: room.is_active,
    initialMessages,
    initialPagination,
    messagesError,
  });

  const conversation = useConversationCreator({
    isInRoom,
  });

  const join = useRoomJoin({
    roomId: room.id,
  });

  const [conversationError, setConversationError] = useState<string | null>(null);

  const handleCreateConversation = async () => {
    try {
      setConversationError(null);
      await conversation.handleCreateConversation();
    } catch (err) {
      setConversationError(err instanceof Error ? err.message : "Failed to create conversation");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-7">
      <RoomHeader
        room={room}
        overview={overview}
        totalParticipants={participantsData.totalParticipants}
        isInRoom={isInRoom}
        joining={join.joining}
        selectedStatus={status.selectedStatus}
        statusOptions={status.statusOptions}
        statusSubmitting={status.statusSubmitting}
        statusFeedback={status.statusFeedback}
        statusError={status.statusError}
        canUpdateStatus={status.canUpdateStatus}
        onJoin={join.handleJoin}
        onStatusUpdate={status.handleStatusUpdate}
      />

      {join.feedback && <AlertStrip>{join.feedback}</AlertStrip>}

      {!isInRoom && (
        <AlertStrip variant="notice" className="text-xs uppercase tracking-[0.28em]">
          Join the room to unlock messaging and conversation creation features.
        </AlertStrip>
      )}

      {join.error && <AlertStrip variant="danger">{join.error}</AlertStrip>}
      {conversationError && <AlertStrip variant="danger">{conversationError}</AlertStrip>}

      <GlassPanel as="section" className="rounded-3xl px-6 md:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Room chat</h2>
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-text-subtle">
            {isInRoom
              ? `Auto-refresh every 15 seconds${messages.isPolling ? " (refreshing...)" : ""}`
              : "Join to load messages"}
          </span>
        </div>

        {messages.messagesError && (
          <AlertStrip variant="danger" className="text-xs px-4 py-3">
            {messages.messagesError}
          </AlertStrip>
        )}

        {!isInRoom && !messages.messagesError && (
          <p className="text-xs text-text-subtle">Join the room to load messages and see live activity.</p>
        )}

        <MessageList
          messages={messages.messages}
          currentUsername={currentUsername}
          aiUsernames={participantsData.aiUsernames}
          isInRoom={isInRoom}
        />

        {isInRoom && messages.pagination.hasMore && (
          <div className="flex justify-center">
            <AuroraButton
              onClick={messages.loadOlderMessages}
              variant="ghost"
              className="text-[0.65rem]"
              disabled={messages.isLoadingMore}
            >
              {messages.isLoadingMore ? "Loading..." : "Load older messages"}
            </AuroraButton>
          </div>
        )}

        <div className="text-xs text-text-subtle">
          Showing {messages.messages.length} of {messages.pagination.total ?? messages.messages.length} messages
          {messages.pagination.totalPages > 1 &&
            ` · Page ${messages.pagination.page} of ${messages.pagination.totalPages}`}
        </div>

        <div className="star-divider" />

        <div>
          <h3 className="text-lg font-semibold tracking-[0.08em] text-white">Circle participants</h3>
          <p className="mt-2 text-xs text-text-subtle">
            {participants
              ? `${participantsData.totalParticipants} participant(s)`
              : "Unable to load participants."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {participantsData.participantsData.map((participant: RoomParticipant) => {
              const isCurrentUser = participant.username === currentUsername;
              return (
                <div
                  key={`${participant.is_ai ? "ai" : "user"}-${participant.username}`}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] ${
                    isCurrentUser
                      ? "border-border-aurora bg-aurora-haze text-text-aurora font-semibold"
                      : "border-border-mist bg-surface-soft text-text-soft"
                  }`}
                >
                  <span className={isCurrentUser ? "tracking-normal" : "font-semibold text-white tracking-normal"}>
                    {participant.username}
                  </span>
                  {isCurrentUser && <span className="ml-2">· You</span>}
                  {participant.is_ai && isAdmin ? (
                    <span className="ml-2 text-ai">· AI</span>
                  ) : (
                    !isCurrentUser && !participant.is_ai && <span className="ml-2">· Status: {participant.status ?? "—"}</span>
                  )}
                </div>
              );
            })}
            {participantsData.participantsData.length === 0 && (
              <div className="rounded-full border border-border-mist px-3 py-2 text-xs uppercase tracking-[0.28em] text-text-subtle">
                No users in this room.
              </div>
            )}
          </div>
        </div>

        <div className="star-divider" />

        <div>
          <h3 className="text-lg font-semibold tracking-[0.08em] text-white">Send a message</h3>
          <MessageInput
            isInRoom={isInRoom}
            isRoomActive={room.is_active}
            messageContent={messages.messageContent}
            messageError={messages.messageError}
            messageSubmitting={messages.messageSubmitting}
            messageMaxLength={messages.messageMaxLength}
            onMessageChange={messages.setMessageContent}
            onSendMessage={messages.handleSendMessage}
            onClearError={() => {
              // Message error is cleared automatically in the hook
            }}
          />
        </div>
      </GlassPanel>

      <ConversationCreator
        isInRoom={isInRoom}
        conversationMode={conversation.conversationMode}
        selectedUsers={conversation.selectedUsers}
        selectableParticipants={participantsData.selectableParticipants}
        creatingConversation={conversation.creatingConversation}
        canSubmitConversation={conversation.canSubmitConversation}
        isPrivate={conversation.isPrivate}
        onToggleMode={conversation.toggleConversationMode}
        onToggleUser={conversation.toggleUserSelection}
        onCreate={handleCreateConversation}
        onCancel={conversation.cancelConversationCreation}
      />
    </main>
  );
}
