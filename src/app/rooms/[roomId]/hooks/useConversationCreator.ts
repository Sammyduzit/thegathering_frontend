import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import { canSubmitConversation as canSubmitConversationHelper } from "@/lib/room-chat-helpers";

type ConversationType = "private" | "group";

type UseConversationCreatorParams = {
  isInRoom: boolean;
};

type UseConversationCreatorReturn = {
  conversationMode: ConversationType | null;
  selectedUsers: string[];
  creatingConversation: boolean;
  canSubmitConversation: boolean;
  isPrivate: boolean;
  toggleConversationMode: (mode: ConversationType) => void;
  toggleUserSelection: (username: string) => void;
  handleCreateConversation: () => Promise<void>;
  cancelConversationCreation: () => void;
};

export function useConversationCreator({
  isInRoom,
}: UseConversationCreatorParams): UseConversationCreatorReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createModeFromQuery = searchParams.get("create") as ConversationType | null;

  const initialMode = createModeFromQuery && isInRoom ? createModeFromQuery : null;

  const [conversationMode, setConversationMode] = useState<ConversationType | null>(initialMode);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    if (!isInRoom) {
      setConversationMode(null);
      setSelectedUsers([]);
    }
  }, [isInRoom]);

  const isPrivate = conversationMode === "private";

  const canSubmitConversation = useMemo(
    () => canSubmitConversationHelper(conversationMode, selectedUsers),
    [conversationMode, selectedUsers]
  );

  const toggleConversationMode = (mode: ConversationType) => {
    if (!isInRoom) return;
    setConversationMode(mode);
    setSelectedUsers([]);
  };

  const toggleUserSelection = (username: string) => {
    if (!conversationMode) return;
    setSelectedUsers((prev) => {
      if (isPrivate) {
        return prev.includes(username) ? [] : [username];
      }
      if (prev.includes(username)) {
        return prev.filter((user) => user !== username);
      }
      return [...prev, username];
    });
  };

  const handleCreateConversation = async () => {
    if (!conversationMode || !canSubmitConversation) return;
    setCreatingConversation(true);
    try {
      const { data } = await apiFetch<{ conversation_id: number }>(`/api/conversations`, {
        method: "POST",
        body: {
          participant_usernames: selectedUsers,
          conversation_type: conversationMode,
        },
      });
      setConversationMode(null);
      setSelectedUsers([]);
      router.push(`/conversations/${data.conversation_id}`);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setCreatingConversation(false);
    }
  };

  const cancelConversationCreation = () => {
    setConversationMode(null);
    setSelectedUsers([]);
  };

  return {
    conversationMode,
    selectedUsers,
    creatingConversation,
    canSubmitConversation,
    isPrivate,
    toggleConversationMode,
    toggleUserSelection,
    handleCreateConversation,
    cancelConversationCreation,
  };
}
