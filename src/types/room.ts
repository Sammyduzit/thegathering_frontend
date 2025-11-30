import type { ConversationMessage, PaginatedMessagesResponse as ConversationPaginatedMessagesResponse } from "./conversation";

export type Room = {
  id: number;
  name: string;
  description: string | null;
  max_users: number | null;
  is_translation_enabled: boolean;
  is_active: boolean;
  has_ai: boolean;
  created_at: string;
};

export type RoomParticipant = {
  id: number;
  username: string;
  avatar_url: string | null;
  status: string | null;
  is_ai: boolean;
  last_active: string | null;
};

export type RoomParticipantsResponse = {
  room_id: number;
  room_name: string;
  total_participants: number;
  participants: RoomParticipant[];
};

export type RoomMessage = ConversationMessage;

export type PaginatedRoomMessagesResponse = ConversationPaginatedMessagesResponse<RoomMessage>;

export type RoomOverviewInfo = {
  activeRooms: number | null;
  countMessage: string | null;
  healthStatus: string | null;
  healthMessage: string | null;
};

/**
 * Response for room deletion.
 * DELETE /rooms/{id}
 */
export type RoomDeleteResponse = {
  message: string;
  room_id: number;
  users_removed: number;
  conversations_archived: number;
  messages_deleted: number;
};

/**
 * Response for room join.
 * POST /rooms/{id}/join
 */
export type RoomJoinResponse = {
  message: string;
  room_id: number;
  room_name: string;
  user_count: number;
};

/**
 * Response for room leave.
 * POST /rooms/{id}/leave
 */
export type RoomLeaveResponse = {
  message: string;
  room_id: number;
  room_name: string;
};

/**
 * Response for status update.
 * PATCH /rooms/users/status
 */
export type StatusUpdateResponse = {
  message: string;
  status: 'available' | 'busy' | 'away';
};

/**
 * Request model for status update.
 */
export type UserStatusUpdate = {
  status: 'available' | 'busy' | 'away';
};
