/**
 * Room Workflow Integration Tests
 * Tests that verify multiple functions working together for room operations
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  applySentRoomMessage,
  mergeOlderRoomMessages,
} from "../../src/lib/room-chat-helpers";
import {
  createMockRoomMessage,
  createMockPaginationState,
} from "../setup/mock-data";
import type { PaginatedRoomMessagesResponse } from "../../src/types/room";

test("Room Workflow - complete message lifecycle", () => {
  // 1. Initial state: empty room
  let messages = [] as ReturnType<typeof createMockRoomMessage>[];
  let pagination = createMockPaginationState({
    page: 1,
    pageSize: 20,
    hasMore: false,
    total: 0,
    totalPages: 1,
  });

  // 2. User sends first message
  const message1 = createMockRoomMessage({
    id: 1,
    content: "Hello!",
    sender_username: "alice",
  });

  const result1 = applySentRoomMessage(messages, pagination, message1, 20);
  messages = result1.messages;
  pagination = result1.pagination;

  assert.equal(messages.length, 1);
  assert.equal(messages[0].content, "Hello!");
  assert.equal(pagination.total, 1);

  // 3. Another user sends a message
  const message2 = createMockRoomMessage({
    id: 2,
    content: "Hi Alice!",
    sender_username: "bob",
  });

  const result2 = applySentRoomMessage(messages, pagination, message2, 20);
  messages = result2.messages;
  pagination = result2.pagination;

  assert.equal(messages.length, 2);
  assert.equal(messages[0].content, "Hi Alice!"); // Newest first
  assert.equal(messages[1].content, "Hello!");
  assert.equal(pagination.total, 2);

  // 4. User loads older messages
  const olderMessagesResponse: PaginatedRoomMessagesResponse = {
    messages: [
      createMockRoomMessage({ id: 3, content: "Old message 1" }),
      createMockRoomMessage({ id: 4, content: "Old message 2" }),
    ],
    page: 2,
    page_size: 20,
    total: 4,
    total_pages: 1,
    has_more: false,
  };

  const result3 = mergeOlderRoomMessages(
    messages,
    pagination,
    olderMessagesResponse,
    20
  );
  messages = result3.messages;
  pagination = result3.pagination;

  assert.equal(messages.length, 4);
  assert.equal(pagination.total, 4);
  assert.equal(pagination.hasMore, false);
});

test("Room Workflow - duplicate message handling", () => {
  const message1 = createMockRoomMessage({ id: 1, content: "Test" });

  const messages = [message1];
  const pagination = createMockPaginationState({
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
    hasMore: false,
  });

  // Try to add the same message again (e.g., from polling)
  const result = applySentRoomMessage(messages, pagination, message1, 20);

  assert.equal(result.messages.length, 1);
  assert.equal(result.pagination.total, 1); // Total should not increase
});

test("Room Workflow - pagination with multiple loads", () => {
  // Initial load: Page 1 with 20 messages
  const initialMessages = Array.from({ length: 20 }, (_, i) =>
    createMockRoomMessage({
      id: i + 1,
      content: `Message ${i + 1}`,
    })
  );

  let messages = initialMessages;
  let pagination = createMockPaginationState({
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    hasMore: true,
  });

  assert.equal(pagination.hasMore, true);

  // Load page 2
  const page2Response: PaginatedRoomMessagesResponse = {
    messages: Array.from({ length: 20 }, (_, i) =>
      createMockRoomMessage({
        id: i + 21,
        content: `Message ${i + 21}`,
      })
    ),
    page: 2,
    page_size: 20,
    total: 100,
    total_pages: 5,
    has_more: true,
  };

  const result2 = mergeOlderRoomMessages(
    messages,
    pagination,
    page2Response,
    20
  );
  messages = result2.messages;
  pagination = result2.pagination;

  assert.equal(messages.length, 40);
  assert.equal(pagination.page, 2);
  assert.equal(pagination.hasMore, true);

  // Load page 3
  const page3Response: PaginatedRoomMessagesResponse = {
    messages: Array.from({ length: 20 }, (_, i) =>
      createMockRoomMessage({
        id: i + 41,
        content: `Message ${i + 41}`,
      })
    ),
    page: 3,
    page_size: 20,
    total: 100,
    total_pages: 5,
    has_more: true,
  };

  const result3 = mergeOlderRoomMessages(
    messages,
    pagination,
    page3Response,
    20
  );

  assert.equal(result3.messages.length, 60);
  assert.equal(result3.pagination.page, 3);
  assert.equal(result3.pagination.hasMore, true);
});

test("Room Workflow - real-time updates during pagination", () => {
  // User is viewing older messages (page 2)
  const messages = Array.from({ length: 20 }, (_, i) =>
    createMockRoomMessage({ id: i + 21, content: `Old ${i + 21}` })
  );

  const pagination = createMockPaginationState({
    page: 2,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    hasMore: true,
  });

  // New message arrives in real-time while viewing old messages
  const newMessage = createMockRoomMessage({
    id: 101,
    content: "Just sent!",
  });

  const result = applySentRoomMessage(messages, pagination, newMessage, 20);

  // New message should be prepended
  assert.equal(result.messages[0].id, 101);
  assert.equal(result.messages.length, 21);
  assert.equal(result.pagination.total, 101);
});

test("Room Workflow - message deduplication during merge", () => {
  const existingMessages = [
    createMockRoomMessage({ id: 1, content: "Existing 1" }),
    createMockRoomMessage({ id: 2, content: "Existing 2" }),
  ];

  const pagination = createMockPaginationState({
    page: 1,
    pageSize: 20,
    total: 2,
    totalPages: 1,
    hasMore: false,
  });

  // Server returns some messages that we already have
  const serverResponse: PaginatedRoomMessagesResponse = {
    messages: [
      createMockRoomMessage({ id: 2, content: "Existing 2" }), // Duplicate
      createMockRoomMessage({ id: 3, content: "New 3" }),
      createMockRoomMessage({ id: 4, content: "New 4" }),
    ],
    page: 2,
    page_size: 20,
    total: 4,
    total_pages: 1,
    has_more: false,
  };

  const result = mergeOlderRoomMessages(
    existingMessages,
    pagination,
    serverResponse,
    20
  );

  // Should only have 4 unique messages (not 5)
  assert.equal(result.messages.length, 4);

  const ids = result.messages.map((m) => m.id);
  assert.deepEqual(ids, [1, 2, 3, 4]);
});

test("Room Workflow - fallback page size handling", () => {
  const messages = [createMockRoomMessage({ id: 1 })];

  // Pagination without pageSize set
  const pagination = createMockPaginationState({
    page: 1,
    pageSize: 0, // Not set
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const newMessage = createMockRoomMessage({ id: 2 });

  // Should use fallback page size
  const result = applySentRoomMessage(messages, pagination, newMessage, 25);

  assert.equal(result.pagination.pageSize, 25);
});

test("Room Workflow - concurrent message submissions", () => {
  let messages = [createMockRoomMessage({ id: 1, content: "First" })];
  let pagination = createMockPaginationState({
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
    hasMore: false,
  });

  // Multiple users send messages at the same time
  const message2 = createMockRoomMessage({ id: 2, content: "Second" });
  const message3 = createMockRoomMessage({ id: 3, content: "Third" });
  const message4 = createMockRoomMessage({ id: 4, content: "Fourth" });

  const result1 = applySentRoomMessage(messages, pagination, message2, 20);
  messages = result1.messages;
  pagination = result1.pagination;

  const result2 = applySentRoomMessage(messages, pagination, message3, 20);
  messages = result2.messages;
  pagination = result2.pagination;

  const result3 = applySentRoomMessage(messages, pagination, message4, 20);
  messages = result3.messages;
  pagination = result3.pagination;

  assert.equal(messages.length, 4);
  assert.equal(pagination.total, 4);

  // Messages should be in reverse chronological order (newest first)
  assert.equal(messages[0].id, 4);
  assert.equal(messages[1].id, 3);
  assert.equal(messages[2].id, 2);
  assert.equal(messages[3].id, 1);
});
