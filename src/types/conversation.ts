export type ConversationParticipant = {
  id: number;
  username: string;
  avatar_url: string | null;
  status: string | null;
  is_ai: boolean;
};

export type ConversationMessage = {
  id: number;
  sender_id: number | null;
  sender_username: string | null;
  content: string;
  message_type?: string;
  sent_at: string;
  room_id: number | null;
  conversation_id: number | null;
};

export type ConversationPermissions = {
  can_post: boolean;
  can_manage_participants: boolean;
  can_leave: boolean;
};

export type ConversationListItemResponse = {
  id: number;
  type: string;
  room_id: number | null;
  room_name: string | null;
  participants: string[];
  participant_count: number;
  created_at: string;
  latest_message_at: string | null;
  latest_message_preview: string | null;
};

export type ConversationDetail = {
  id: number;
  type: string;
  room_id: number | null;
  room_name: string | null;
  is_active: boolean;
  created_at: string;
  participants: ConversationParticipant[];
  participant_count: number;
  message_count: number;
  latest_message: ConversationMessage | null;
  permissions: ConversationPermissions;
};

export type PaginatedMessagesResponse<TMessage = ConversationMessage> = {
  messages: TMessage[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
};

/**
 * Response for conversation creation.
 * POST /conversations/
 */
export type ConversationCreateResponse = {
  message: string;
  conversation_id: number;
  participants: number; // Anzahl Participants
};

/**
 * Response for conversation archive/update.
 * PATCH /conversations/{id}
 */
export type ConversationUpdateResponse = {
  message: string;
  conversation_id: number;
  is_active: boolean;
};

/**
 * Request model for adding participants (Human oder AI).
 * POST /conversations/{id}/participants
 */
export type ParticipantAddRequest = {
  username: string; // Backend macht automatisch lookup (Human first, dann AI)
};

/**
 * Response for adding participants.
 */
export type ParticipantAddResponse = {
  message: string;
  conversation_id: number;
  username: string;
  participant_count: number;
};

/**
 * Response for removing participants.
 * DELETE /conversations/{id}/participants/{username}
 */
export type ParticipantRemoveResponse = {
  message: string;
  conversation_id: number;
  username: string;
  participant_count: number;
};
