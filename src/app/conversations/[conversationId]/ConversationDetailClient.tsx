"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { useConversationMessages } from "./hooks/useConversationMessages";
import { useConversationParticipants } from "./hooks/useConversationParticipants";
import { useConversationArchive } from "./hooks/useConversationArchive";
import { ConversationHeader } from "./components/ConversationHeader";
import { ConversationMessageList } from "./components/ConversationMessageList";
import { ConversationMessageInput } from "./components/ConversationMessageInput";
import { ConversationParticipantManager } from "./components/ConversationParticipantManager";
import GlassPanel from "@/components/ui/GlassPanel";
import AlertStrip from "@/components/ui/AlertStrip";
import type { UserResponse } from "@/types/user";
import type {
  ConversationDetail,
  ConversationMessage,
} from "@/types/conversation";

type PaginatedState = {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
  totalPages: number;
};

type Props = {
  conversation: ConversationDetail;
  currentUser: string;
  initialMessages: ConversationMessage[];
  initialPagination: PaginatedState;
};

export default function ConversationDetailClient({
  conversation,
  currentUser,
  initialMessages,
  initialPagination,
}: Props) {
  const [conversationState, setConversationState] = useState<ConversationDetail>(conversation);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    apiFetch<UserResponse>("/api/me")
      .then((user) => setIsAdmin(user.data.is_admin))
      .catch(() => setIsAdmin(false));
  }, []);

  const refreshConversation = async () => {
    const { data } = await apiFetch<ConversationDetail>(`/api/conversations/${conversation.id}`);
    setConversationState(data);
    participantsHook.setParticipants(data.participants);
  };

  const handleMessageCountUpdate = (count: number) => {
    setConversationState((prev) => ({ ...prev, message_count: count }));
  };

  const handleLatestMessageUpdate = (message: ConversationMessage | null) => {
    setConversationState((prev) => ({ ...prev, latest_message: message }));
  };

  const messagesHook = useConversationMessages({
    conversationId: conversation.id,
    initialMessages,
    initialPagination,
    onMessageCountUpdate: handleMessageCountUpdate,
    onLatestMessageUpdate: handleLatestMessageUpdate,
  });

  const participantsHook = useConversationParticipants({
    conversationId: conversation.id,
    initialParticipants: conversation.participants,
    currentUser,
    onRefresh: refreshConversation,
  });

  const archiveHook = useConversationArchive({
    conversationId: conversation.id,
    isActive: conversationState.is_active,
    onRefresh: refreshConversation,
  });

  const permissions = conversationState.permissions ?? {
    can_post: false,
    can_manage_participants: false,
    can_leave: false,
  };

  const canManageParticipants = permissions.can_manage_participants;
  const canLeave = permissions.can_leave;
  const canAddParticipant = canManageParticipants;
  const canPostMessages = permissions.can_post;
  const canArchiveConversation = canLeave;

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-7">
      <ConversationHeader
        id={conversationState.id}
        roomName={conversationState.room_name}
        type={conversationState.type}
        roomId={conversationState.room_id}
        createdAt={conversationState.created_at}
        participantCount={conversationState.participant_count}
        messageCount={conversationState.message_count}
        isActive={conversationState.is_active}
        isArchiving={archiveHook.isArchiving}
        canArchive={canArchiveConversation}
        onArchiveToggle={() => archiveHook.handleArchiveToggle(canArchiveConversation)}
      />

      {archiveHook.feedback && <AlertStrip>{archiveHook.feedback}</AlertStrip>}

      {!conversationState.is_active && (
        <AlertStrip variant="notice" className="text-xs uppercase tracking-[0.28em]">
          This conversation is archived. Messaging and participant management may be limited until it is restored.
        </AlertStrip>
      )}

      {archiveHook.error && <AlertStrip variant="danger">{archiveHook.error}</AlertStrip>}
      {participantsHook.feedback && <AlertStrip>{participantsHook.feedback}</AlertStrip>}
      {participantsHook.error && <AlertStrip variant="danger">{participantsHook.error}</AlertStrip>}

      <GlassPanel as="section" className="rounded-3xl px-6 md:px-8 py-6 space-y-6">
        <ConversationMessageList
          messages={messagesHook.messages}
          pagination={messagesHook.pagination}
          isPolling={messagesHook.isPolling}
          isLoadingMore={messagesHook.isLoadingMore}
          onLoadOlder={messagesHook.loadOlderMessages}
        />

        <div className="star-divider" />

        <ConversationMessageInput
          canPost={canPostMessages}
          messageContent={messagesHook.messageContent}
          messageError={messagesHook.messageError}
          messageSubmitting={messagesHook.messageSubmitting}
          onMessageChange={messagesHook.setMessageContent}
          onSendMessage={() => messagesHook.handleSendMessage(canPostMessages)}
          onClearError={() => messagesHook.setMessageError(null)}
        />
      </GlassPanel>

      <GlassPanel as="section" className="rounded-3xl px-6 md:px-8 py-6 space-y-6">
        <ConversationParticipantManager
          participants={participantsHook.participants}
          currentUser={currentUser}
          usernameToAdd={participantsHook.usernameToAdd}
          submitting={participantsHook.submitting}
          canAddParticipant={canAddParticipant}
          canManageParticipants={canManageParticipants}
          canLeave={canLeave}
          isAdmin={isAdmin}
          onUsernameChange={participantsHook.setUsernameToAdd}
          onAddParticipant={() => participantsHook.handleAddParticipant(canAddParticipant)}
          onRemoveParticipant={(username) =>
            participantsHook.handleRemoveParticipant(username, canManageParticipants, canLeave)
          }
        />
      </GlassPanel>

      {!canManageParticipants && (
        <p className="text-xs text-text-faint">
          Removing other participants may require additional permissions. The server enforces access rules.
        </p>
      )}
    </main>
  );
}
