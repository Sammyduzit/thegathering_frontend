import { useCallback, useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getMessageSendErrorMessage } from "@/lib/client-api";
import {
  applySentRoomMessage,
  mergeOlderRoomMessages,
  type PaginationState,
} from "@/lib/room-chat-helpers";
import type { PaginatedRoomMessagesResponse, RoomMessage } from "@/types/room";

const MESSAGE_MAX_LENGTH = 500;

type UseRoomMessagesParams = {
  roomId: number;
  isInRoom: boolean;
  isRoomActive: boolean;
  initialMessages: RoomMessage[];
  initialPagination: PaginationState;
  messagesError: string | null;
};

type UseRoomMessagesReturn = {
  messages: RoomMessage[];
  messagesError: string | null;
  pagination: PaginationState;
  isLoadingMore: boolean;
  isPolling: boolean;
  messageContent: string;
  messageError: string | null;
  messageSubmitting: boolean;
  messageMaxLength: number;
  setMessageContent: (content: string) => void;
  loadOlderMessages: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
};

export function useRoomMessages({
  roomId,
  isInRoom,
  isRoomActive,
  initialMessages,
  initialPagination,
  messagesError,
}: UseRoomMessagesParams): UseRoomMessagesReturn {
  const [messages, setMessages] = useState<RoomMessage[]>(initialMessages);
  const [messagesErrorState, setMessagesErrorState] = useState<string | null>(messagesError);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const [messageContent, setMessageContent] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSubmitting, setMessageSubmitting] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setPagination(initialPagination);
  }, [initialPagination]);

  useEffect(() => {
    setMessagesErrorState(messagesError);
  }, [messagesError]);

  const refreshLatestMessages = useCallback(async () => {
    if (!isInRoom) return;

    const pageSizeForFetch = pagination.pageSize || initialPagination.pageSize || 50;

    try {
      setIsPolling(true);
      const { data } = await apiFetch<PaginatedRoomMessagesResponse>(
        `/api/rooms/${roomId}/messages?page=1&page_size=${pageSizeForFetch}`,
        { csrf: false }
      );

      const latestIds = new Set(data.messages.map((message) => message.id));

      setMessages((prev) => {
        const merged = [...data.messages];
        for (const message of prev) {
          if (!latestIds.has(message.id)) {
            merged.push(message);
          }
        }
        return merged;
      });

      setPagination((prev) => {
        const resolvedPageSize = data.page_size || prev.pageSize || pageSizeForFetch;
        const fallbackTotal =
          data.total ??
          prev.total ??
          (prev.page > 0 ? prev.page * (prev.pageSize || resolvedPageSize || pageSizeForFetch) : 0);
        const totalPages =
          data.total_pages ||
          (resolvedPageSize ? Math.max(1, Math.ceil(fallbackTotal / resolvedPageSize)) : prev.totalPages || 1);
        const normalizedPage = data.page || 1;
        const hasMore = data.has_more ?? normalizedPage < totalPages;
        return {
          page: normalizedPage,
          pageSize: resolvedPageSize,
          hasMore,
          total: fallbackTotal,
          totalPages,
        };
      });

      setMessagesErrorState(null);
    } catch (err) {
      console.error("Polling room messages failed", err);
    } finally {
      setIsPolling(false);
    }
  }, [initialPagination.pageSize, isInRoom, pagination.pageSize, roomId]);

  const loadOlderMessages = useCallback(async () => {
    if (!isInRoom || !pagination.hasMore || isLoadingMore) {
      return;
    }

    const fallbackPageSize = pagination.pageSize || initialPagination.pageSize || 50;

    try {
      setIsLoadingMore(true);
      const { data } = await apiFetch<PaginatedRoomMessagesResponse>(
        `/api/rooms/${roomId}/messages?page=${pagination.page + 1}&page_size=${fallbackPageSize}`,
        { csrf: false }
      );

      const { messages: updatedMessages, pagination: updatedPagination } = mergeOlderRoomMessages(
        messages,
        pagination,
        data,
        fallbackPageSize
      );

      setMessages(updatedMessages);
      setPagination(updatedPagination);
      setMessagesErrorState(null);
    } catch (err) {
      setMessagesErrorState(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    initialPagination.pageSize,
    isInRoom,
    isLoadingMore,
    messages,
    pagination,
    roomId,
  ]);

  const handleSendMessage = async () => {
    if (!isInRoom) {
      setMessageError("Join the room to send messages.");
      return;
    }

    const trimmed = messageContent.trim();

    if (!trimmed) {
      setMessageError("Message content cannot be empty.");
      return;
    }

    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      setMessageError(`Message content must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setMessageSubmitting(true);
    setMessageError(null);

    try {
      const { data } = await apiFetch<RoomMessage>(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        body: { content: trimmed },
      });

      const fallbackPageSize = pagination.pageSize || initialPagination.pageSize || 50;
      const { messages: updatedMessages, pagination: updatedPagination } = applySentRoomMessage(
        messages,
        pagination,
        data,
        fallbackPageSize
      );

      setMessages(updatedMessages);
      setPagination(updatedPagination);

      setMessageContent("");
      setMessagesErrorState(null);
    } catch (err) {
      setMessageError(getMessageSendErrorMessage(err));
    } finally {
      setMessageSubmitting(false);
    }
  };

  const shouldPoll = isInRoom && isRoomActive;

  useEffect(() => {
    if (!shouldPoll) return;

    const intervalId = window.setInterval(() => {
      void refreshLatestMessages();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshLatestMessages, shouldPoll]);

  return {
    messages,
    messagesError: messagesErrorState,
    pagination,
    isLoadingMore,
    isPolling,
    messageContent,
    messageError,
    messageSubmitting,
    messageMaxLength: MESSAGE_MAX_LENGTH,
    setMessageContent,
    loadOlderMessages,
    handleSendMessage,
  };
}
