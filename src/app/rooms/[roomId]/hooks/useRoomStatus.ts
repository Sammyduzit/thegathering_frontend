import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage } from "@/lib/client-api";
import type { RoomParticipant } from "@/types/room";

const STATUS_OPTIONS = ["available", "busy", "away"] as const;

type UseRoomStatusParams = {
  currentParticipant: RoomParticipant | null;
};

type UseRoomStatusReturn = {
  selectedStatus: string;
  statusSubmitting: boolean;
  statusFeedback: string | null;
  statusError: string | null;
  statusOptions: readonly string[];
  canUpdateStatus: boolean;
  handleStatusUpdate: (nextStatus: string) => Promise<void>;
};

export function useRoomStatus({ currentParticipant }: UseRoomStatusParams): UseRoomStatusReturn {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentParticipant?.status ?? STATUS_OPTIONS[0]
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(currentParticipant?.status ?? STATUS_OPTIONS[0]);
  }, [currentParticipant?.status]);

  const canUpdateStatus = Boolean(currentParticipant);

  const handleStatusUpdate = async (nextStatus: string) => {
    const previousStatus = selectedStatus;
    setSelectedStatus(nextStatus);

    if (nextStatus === currentParticipant?.status) {
      return;
    }

    setStatusSubmitting(true);
    setStatusFeedback(null);
    setStatusError(null);

    try {
      await apiFetch("/api/rooms/users/status", {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setStatusFeedback("Status updated.");
      router.refresh();
    } catch (err) {
      setStatusError(getErrorMessage(err));
      // Rollback to previous status on failure
      setSelectedStatus(previousStatus);
    } finally {
      setStatusSubmitting(false);
    }
  };

  return {
    selectedStatus,
    statusSubmitting,
    statusFeedback,
    statusError,
    statusOptions: STATUS_OPTIONS,
    canUpdateStatus,
    handleStatusUpdate,
  };
}
