/**
 * Mock Data - Single Source of Truth for test data
 * Provides consistent mock data for integration tests
 */

import type {
  Room,
  RoomOverviewInfo,
  RoomMessage,
  RoomParticipant,
  RoomParticipantsResponse,
} from "../../src/types/room";
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationParticipant,
} from "../../src/types/conversation";
import type { PaginationState } from "../../src/lib/room-chat-helpers";

// Room Mock Data
export function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    name: "Test Room",
    description: "Test Description",
    max_users: null,
    is_translation_enabled: false,
    is_active: true,
    has_ai: false,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createMockRoomOverview(
  overrides: Partial<RoomOverviewInfo> = {}
): RoomOverviewInfo {
  return {
    activeRooms: 1,
    countMessage: "5 messages",
    healthStatus: "healthy",
    healthMessage: "All systems go",
    ...overrides,
  };
}

export function createMockRoomParticipant(
  overrides: Partial<RoomParticipant> = {}
): RoomParticipant {
  return {
    id: 1,
    username: "testuser",
    avatar_url: null,
    status: null,
    is_ai: false,
    last_active: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createMockRoomParticipantsResponse(
  participants: RoomParticipant[] = [],
  options?: { allowEmpty?: boolean }
): RoomParticipantsResponse {
  const resolvedParticipants =
    participants.length > 0
      ? participants
      : options?.allowEmpty
      ? []
      : [createMockRoomParticipant()];

  return {
    room_id: 1,
    room_name: "Test Room",
    total_participants: resolvedParticipants.length,
    participants: resolvedParticipants,
  };
}

export function createMockRoomMessage(
  overrides: Partial<RoomMessage> = {}
): RoomMessage {
  return {
    id: 1,
    sender_id: 1,
    sender_username: "testuser",
    content: "Test message",
    sent_at: "2024-01-01T00:00:00Z",
    room_id: 1,
    conversation_id: null,
    ...overrides,
  };
}

export function createMockPaginationState(
  overrides: Partial<PaginationState> = {}
): PaginationState {
  return {
    page: 1,
    pageSize: 25,
    hasMore: false,
    total: 0,
    totalPages: 1,
    ...overrides,
  };
}

// Conversation Mock Data
export function createMockConversationParticipant(
  overrides: Partial<ConversationParticipant> = {}
): ConversationParticipant {
  return {
    id: 1,
    username: "testuser",
    avatar_url: null,
    status: null,
    is_ai: false,
    ...overrides,
  };
}

export function createMockConversationMessage(
  overrides: Partial<ConversationMessage> = {}
): ConversationMessage {
  return {
    id: 1,
    sender_id: 1,
    sender_username: "testuser",
    content: "Test message",
    sent_at: "2024-01-01T00:00:00Z",
    room_id: null,
    conversation_id: 1,
    ...overrides,
  };
}

export function createMockConversationDetail(
  overrides: Partial<ConversationDetail> = {}
): ConversationDetail {
  const defaultParticipants = [
    createMockConversationParticipant({ id: 1, username: "user1" }),
    createMockConversationParticipant({ id: 2, username: "user2" }),
  ];

  const {
    participants = defaultParticipants,
    permissions: overridePermissions,
    ...rest
  } = overrides;

  return {
    id: 1,
    type: "private",
    room_id: null,
    room_name: "Test Room",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    participants,
    participant_count: participants.length,
    message_count: 0,
    latest_message: null,
    permissions: {
      can_post: true,
      can_manage_participants: false,
      can_leave: true,
      ...overridePermissions,
    },
    ...rest,
  };
}

// API Response Mocks
export const mockApiResponses = {
  roomMessages: (messages: RoomMessage[] = []) => ({
    messages: messages.length ? messages : [createMockRoomMessage()],
    pagination: {
      has_more: false,
      oldest_message_id: null,
    },
  }),

  conversationMessages: (messages: ConversationMessage[] = []) => ({
    messages: messages.length ? messages : [createMockConversationMessage()],
    has_more: false,
  }),

  success: { success: true },
  error: (message: string) => ({ detail: message }),
};

// User Mock Data
export const mockUsers = {
  currentUser: "currentuser",
  alice: createMockRoomParticipant({
    id: 2,
    username: "alice",
  }),
  bob: createMockRoomParticipant({ id: 3, username: "bob" }),
  aiBot: createMockRoomParticipant({
    id: 4,
    username: "aibot",
    is_ai: true,
  }),
};
