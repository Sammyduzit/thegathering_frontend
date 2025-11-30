import type { PaginatedRoomMessagesResponse, RoomMessage } from "@/types/room";

export type PaginationState = {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
  totalPages: number;
};

type ApplySentResult = {
  messages: RoomMessage[];
  pagination: PaginationState;
};

type MergeOlderResult = {
  messages: RoomMessage[];
  pagination: PaginationState;
};

export function applySentRoomMessage(
  previousMessages: RoomMessage[],
  previousPagination: PaginationState,
  newMessage: RoomMessage,
  pageSizeFallback: number
): ApplySentResult {
  const exists = previousMessages.some((message) => message.id === newMessage.id);
  const messages = exists ? previousMessages : [newMessage, ...previousMessages];

  const pageSize = previousPagination.pageSize || pageSizeFallback;
  const previousTotal = previousPagination.total ?? previousPagination.page * pageSize;
  const total = previousTotal + (exists ? 0 : 1);
  const totalPages = Math.max(previousPagination.totalPages, Math.ceil(total / pageSize));

  return {
    messages,
    pagination: {
      page: previousPagination.page,
      pageSize,
      hasMore: previousPagination.page < totalPages,
      total,
      totalPages,
    },
  };
}

export function mergeOlderRoomMessages(
  previousMessages: RoomMessage[],
  previousPagination: PaginationState,
  response: PaginatedRoomMessagesResponse,
  fallbackPageSize: number
): MergeOlderResult {
  const existingIds = new Set(previousMessages.map((message) => message.id));
  const additional = response.messages.filter((message) => !existingIds.has(message.id));
  const messages = [...previousMessages, ...additional];

  const pageSize = response.page_size || previousPagination.pageSize || fallbackPageSize;
  const page = response.page || previousPagination.page + 1;
  const total = response.total ?? previousPagination.total ?? previousPagination.page * pageSize;
  const totalPages =
    response.total_pages || (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : previousPagination.totalPages);
  const hasMore = response.has_more ?? page < totalPages;

  return {
    messages,
    pagination: {
      page,
      pageSize,
      hasMore,
      total,
      totalPages,
    },
  };
}

export function canSubmitConversation(mode: "private" | "group" | null, selected: string[]): boolean {
  if (!mode) return false;
  if (mode === "private") {
    return selected.length === 1;
  }
  return selected.length >= 1;
}
