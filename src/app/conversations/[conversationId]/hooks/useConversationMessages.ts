import { useState, useEffect, useCallback } from "react";
import { apiFetch, getMessageSendErrorMessage } from "@/lib/client-api";
import type { ConversationMessage, PaginatedMessagesResponse } from "@/types/conversation";

type PaginatedState = {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
  totalPages: number;
};

type UseConversationMessagesProps = {
  conversationId: number;
  initialMessages: ConversationMessage[];
  initialPagination: PaginatedState;
  onMessageCountUpdate: (count: number) => void;
  onLatestMessageUpdate: (message: ConversationMessage | null) => void;
};

export function useConversationMessages({
  conversationId,
  initialMessages,
  initialPagination,
  onMessageCountUpdate,
  onLatestMessageUpdate,
}: UseConversationMessagesProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [pagination, setPagination] = useState<PaginatedState>(initialPagination);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSubmitting, setMessageSubmitting] = useState(false);

  const pageSize = pagination.pageSize || 50;

  const refreshLatestMessages = useCallback(async () => {
    try {
      setIsPolling(true);
      const { data } = await apiFetch<PaginatedMessagesResponse>(
        `/api/conversations/${conversationId}/messages?page=1&page_size=${pageSize}`,
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
        const resolvedPageSize = data.page_size || prev.pageSize || pageSize || 50;
        const previousTotalFallback = prev.total ?? (prev.pageSize ? prev.page * prev.pageSize : 0);
        const rawTotal = data.total ?? previousTotalFallback;
        const computedTotalPages =
          data.total_pages || (rawTotal > 0 ? Math.max(1, Math.ceil(rawTotal / resolvedPageSize)) : prev.totalPages);
        const safeTotalPages = computedTotalPages || 1;
        const highestLoaded = Math.max(prev.page, data.page || 1);
        const normalizedPage = safeTotalPages === 0 ? 1 : Math.min(highestLoaded, safeTotalPages);

        return {
          page: normalizedPage,
          pageSize: resolvedPageSize,
          hasMore: data.has_more ?? normalizedPage < safeTotalPages,
          total: rawTotal,
          totalPages: safeTotalPages,
        };
      });

      onLatestMessageUpdate(data.messages[0] ?? null);
      onMessageCountUpdate(data.total ?? 0);
    } catch (err) {
      console.error("Polling latest messages failed", err);
    } finally {
      setIsPolling(false);
    }
  }, [conversationId, pageSize, onLatestMessageUpdate, onMessageCountUpdate]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshLatestMessages();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshLatestMessages]);

  const loadOlderMessages = async () => {
    if (!pagination.hasMore || isLoadingMore) {
      return;
    }

    const nextPage = pagination.page + 1;

    try {
      setIsLoadingMore(true);
      const { data } = await apiFetch<PaginatedMessagesResponse>(
        `/api/conversations/${conversationId}/messages?page=${nextPage}&page_size=${pageSize}`,
        { csrf: false }
      );

      const resolvedPageSize = data.page_size || pageSize || pagination.pageSize || 50;
      const totalPages = data.total_pages || Math.max(1, Math.ceil((data.total ?? pagination.total ?? 0) / resolvedPageSize));

      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.id));
        const additional = data.messages.filter((message) => !existingIds.has(message.id));
        return [...prev, ...additional];
      });

      setPagination({
        page: data.page || nextPage,
        pageSize: resolvedPageSize,
        hasMore: data.has_more,
        total: data.total ?? pagination.total ?? 0,
        totalPages,
      });
    } catch (err) {
      console.error("Failed to load older messages", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (canPost: boolean) => {
    if (!canPost) {
      setMessageError("You do not have permission to send messages in this conversation.");
      return;
    }

    const trimmed = messageContent.trim();

    if (!trimmed) {
      setMessageError("Message content cannot be empty.");
      return;
    }

    if (trimmed.length > 500) {
      setMessageError("Message content must be 500 characters or fewer.");
      return;
    }

    setMessageSubmitting(true);
    setMessageError(null);

    try {
      const { data } = await apiFetch<ConversationMessage>(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: { content: trimmed },
        }
      );

      setMessages((prev) => {
        const exists = prev.some((message) => message.id === data.id);
        if (exists) {
          return prev;
        }
        return [data, ...prev];
      });

      setPagination((prev) => {
        const pageSizeValue = prev.pageSize || pageSize || 50;
        const fallbackTotal = prev.total ?? prev.page * pageSizeValue;
        const total = fallbackTotal + 1;
        const totalPages = Math.max(prev.totalPages, Math.ceil(total / pageSizeValue));
        return {
          page: prev.page,
          pageSize: pageSizeValue,
          hasMore: prev.page < totalPages,
          total,
          totalPages,
        };
      });

      onLatestMessageUpdate(data);
      onMessageCountUpdate(pagination.total + 1);

      setMessageContent("");
    } catch (err) {
      setMessageError(getMessageSendErrorMessage(err));
    } finally {
      setMessageSubmitting(false);
    }
  };

  return {
    messages,
    pagination,
    isLoadingMore,
    isPolling,
    messageContent,
    messageError,
    messageSubmitting,
    setMessageContent,
    setMessageError,
    loadOlderMessages,
    handleSendMessage,
  };
}
