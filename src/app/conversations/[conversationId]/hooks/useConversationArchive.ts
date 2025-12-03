import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";

type UseConversationArchiveProps = {
  conversationId: number;
  isActive: boolean;
  onRefresh: () => Promise<void>;
};

export function useConversationArchive({
  conversationId,
  isActive,
  onRefresh,
}: UseConversationArchiveProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleArchiveToggle = async (canArchive: boolean) => {
    if (!canArchive) {
      setError("You are not allowed to modify this conversation's archive state.");
      return;
    }

    setIsArchiving(true);
    setFeedback(null);
    setError(null);

    try {
      if (isActive) {
        await apiFetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
          expectJson: false,
        });
        // Redirect to conversations list after deleting with success message
        router.push('/conversations/?message=Conversation+deleted+successfully');
      } else {
        const { data } = await apiFetch<{ message?: string }>(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          body: { is_active: true },
        });

        const serverMessage = data?.message ?? "Conversation restored successfully.";
        setFeedback(serverMessage);
        await onRefresh();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsArchiving(false);
    }
  };

  return {
    isArchiving,
    feedback,
    error,
    handleArchiveToggle,
  };
}
