import { useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import type { ConversationParticipant } from "@/types/conversation";

type UseConversationParticipantsProps = {
  conversationId: number;
  initialParticipants: ConversationParticipant[];
  currentUser: string;
  onRefresh: () => Promise<void>;
};

export function useConversationParticipants({
  conversationId,
  initialParticipants,
  currentUser,
  onRefresh,
}: UseConversationParticipantsProps) {
  const [participants, setParticipants] = useState<ConversationParticipant[]>(initialParticipants);
  const [usernameToAdd, setUsernameToAdd] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddParticipant = async (canAdd: boolean) => {
    if (!usernameToAdd.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!canAdd) {
      setError("You do not have permission to add participants.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      await apiFetch(`/api/conversations/${conversationId}/participants`, {
        method: "POST",
        body: { username: usernameToAdd.trim() },
      });
      setFeedback(`Participant '${usernameToAdd.trim()}' added successfully.`);
      setUsernameToAdd("");
      await onRefresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (username: string, canManage: boolean, canLeave: boolean) => {
    const isSelf = username === currentUser;
    const canRemove = canManage || (isSelf && canLeave);

    if (!canRemove) {
      setError("You do not have permission to remove this participant.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setError(null);
    try {
      const encodedUsername = encodeURIComponent(username);
      await apiFetch(`/api/conversations/${conversationId}/participants/${encodedUsername}`, {
        method: "DELETE",
        expectJson: false,
      });
      setFeedback(`Participant '${username}' removed.`);
      await onRefresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    participants,
    setParticipants,
    usernameToAdd,
    setUsernameToAdd,
    feedback,
    error,
    submitting,
    handleAddParticipant,
    handleRemoveParticipant,
  };
}
