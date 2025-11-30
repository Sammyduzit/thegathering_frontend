import { useMemo } from "react";
import type { RoomParticipant, RoomParticipantsResponse } from "@/types/room";

export type SelectableParticipant = {
  username: string;
  label: string;
  isAi: boolean;
  status: string | null;
};

type UseRoomParticipantsParams = {
  participants: RoomParticipantsResponse | null;
  currentUsername: string;
};

type UseRoomParticipantsReturn = {
  participantsData: RoomParticipant[];
  totalParticipants: number;
  otherParticipants: RoomParticipant[];
  currentParticipant: RoomParticipant | null;
  humanParticipants: SelectableParticipant[];
  aiParticipants: SelectableParticipant[];
  selectableParticipants: SelectableParticipant[];
  aiUsernames: Set<string>;
};

export function useRoomParticipants({
  participants,
  currentUsername,
}: UseRoomParticipantsParams): UseRoomParticipantsReturn {
  const participantsData = useMemo(
    () => participants?.participants ?? [],
    [participants]
  );

  const totalParticipants = participants?.total_participants ?? 0;

  const otherParticipants = useMemo(
    () => participantsData.filter((participant) => participant.username !== currentUsername),
    [participantsData, currentUsername]
  );

  const currentParticipant = useMemo(
    () => participantsData.find((participant) => participant.username === currentUsername) ?? null,
    [participantsData, currentUsername]
  );

  const humanParticipants = useMemo<SelectableParticipant[]>(
    () =>
      otherParticipants
        .filter((participant) => !participant.is_ai)
        .map((participant) => ({
          username: participant.username,
          label: participant.username,
          isAi: false,
          status: participant.status ?? null,
        })),
    [otherParticipants]
  );

  const aiParticipants = useMemo<SelectableParticipant[]>(
    () =>
      otherParticipants
        .filter((participant) => participant.is_ai)
        .map((participant) => ({
          username: participant.username,
          label: participant.username,
          isAi: true,
          status: participant.status ?? null,
        })),
    [otherParticipants]
  );

  const selectableParticipants = useMemo(
    () => [...humanParticipants, ...aiParticipants],
    [humanParticipants, aiParticipants]
  );

  const aiUsernames = useMemo(
    () =>
      new Set(
        participantsData
          .filter((participant) => participant.is_ai)
          .map((participant) => participant.username)
      ),
    [participantsData]
  );

  return {
    participantsData,
    totalParticipants,
    otherParticipants,
    currentParticipant,
    humanParticipants,
    aiParticipants,
    selectableParticipants,
    aiUsernames,
  };
}
