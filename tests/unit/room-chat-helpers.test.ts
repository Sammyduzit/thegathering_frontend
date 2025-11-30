import test from "node:test";
import assert from "node:assert/strict";

import { applySentRoomMessage, mergeOlderRoomMessages, canSubmitConversation } from "../../src/lib/room-chat-helpers";
import type { PaginatedRoomMessagesResponse } from "../../src/types/room";
import { createMockRoomMessage, createMockPaginationState } from "../setup/mock-data";

const baseMessage = createMockRoomMessage({
  id: 1,
  sender_username: "alice",
  content: "Hello",
  sent_at: new Date("2024-01-01T12:00:00Z").toISOString(),
  room_id: 5,
});

const initialPagination = createMockPaginationState({
  pageSize: 50,
  total: 1,
  totalPages: 1,
});

test("applySentRoomMessage prepends unique message and updates pagination", () => {
  const result = applySentRoomMessage([baseMessage], initialPagination, {
    ...baseMessage,
    id: 2,
    content: "Second",
  }, 50);

  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].id, 2);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.hasMore, false);
});

test("applySentRoomMessage ignores duplicates", () => {
  const result = applySentRoomMessage([baseMessage], initialPagination, baseMessage, 50);
  assert.equal(result.messages.length, 1);
  assert.equal(result.pagination.total, 1);
});

test("mergeOlderRoomMessages appends new messages and computes pagination", () => {
  const response: PaginatedRoomMessagesResponse = {
    messages: [
      {
        ...baseMessage,
        id: 0,
        content: "Earlier",
        sent_at: new Date("2023-12-31T23:59:00Z").toISOString(),
      },
    ],
    total: 2,
    page: 2,
    page_size: 50,
    total_pages: 1,
    has_more: false,
  };

  const result = mergeOlderRoomMessages([baseMessage], initialPagination, response, 50);
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[1].id, 0);
  assert.equal(result.pagination.page, 2);
  assert.equal(result.pagination.hasMore, false);
});

test("canSubmitConversation enforces participant counts", () => {
  assert.equal(canSubmitConversation("private", ["bob"]), true);
  assert.equal(canSubmitConversation("private", []), false);
  assert.equal(canSubmitConversation("group", ["bob"]), true);
  assert.equal(canSubmitConversation("group", []), false);
  assert.equal(canSubmitConversation(null, ["bob"]), false);
});
