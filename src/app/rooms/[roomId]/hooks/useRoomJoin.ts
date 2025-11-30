import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";

type UseRoomJoinParams = {
  roomId: number;
};

type UseRoomJoinReturn = {
  joining: boolean;
  feedback: string | null;
  error: string | null;
  handleJoin: () => Promise<void>;
  clearFeedback: () => void;
  clearError: () => void;
};

export function useRoomJoin({ roomId }: UseRoomJoinParams): UseRoomJoinReturn {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    setFeedback(null);
    try {
      await apiFetch(`/api/rooms/${roomId}`, { method: "POST", expectJson: false });
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  const clearFeedback = () => setFeedback(null);
  const clearError = () => setError(null);

  return {
    joining,
    feedback,
    error,
    handleJoin,
    clearFeedback,
    clearError,
  };
}
