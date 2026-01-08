/**
 * AI Response Strategies (Backend: app/schemas/ai_entities.py)
 */
export const ROOM_RESPONSE_STRATEGIES = [
  'room_mention_only',
  'room_probabilistic',
  'room_active',
  'no_response',
] as const;

export const CONVERSATION_RESPONSE_STRATEGIES = [
  'conv_every_message',
  'conv_on_questions',
  'conv_smart',
  'no_response',
] as const;

export type RoomResponseStrategy = (typeof ROOM_RESPONSE_STRATEGIES)[number];
export type ConversationResponseStrategy =
  (typeof CONVERSATION_RESPONSE_STRATEGIES)[number];

/**
 * AI Entity status values.
 */
export type AIEntityStatus = 'online' | 'offline';

/**
 * AI Entity response model from backend.
 * Reflects GET /ai/entities/{id} response.
 */
export type AIEntityResponse = {
  id: number;
  username: string; // Unique identifier (kann Leerzeichen enthalten)
  description: string | null;
  system_prompt: string;
  model_name: string;
  temperature: number | null;
  max_tokens: number | null;
  room_response_strategy: RoomResponseStrategy;
  conversation_response_strategy: ConversationResponseStrategy;
  response_probability: number | null; // 0.0-1.0, nur relevant bei room_probabilistic
  cooldown_seconds: number | null; // 0-3600 oder null
  config: Record<string, unknown> | null;
  avatar_url: string | null; // Auto-generated (DiceBear "bottts") or custom
  is_active: boolean;
  status: AIEntityStatus;
  current_room_id: number | null;
  current_room_name: string | null;
  created_at: string;
  updated_at: string | null;
};

/**
 * Request model for creating AI entities.
 * POST /ai/entities
 */
export type AIEntityCreate = {
  username: string;
  description?: string | null;
  system_prompt: string;
  model_name: string;
  temperature?: number | null; // 0.0-2.0
  max_tokens?: number | null; // 1-32000
  room_response_strategy?: RoomResponseStrategy;
  conversation_response_strategy?: ConversationResponseStrategy;
  response_probability?: number | null;
  cooldown_seconds?: number | null;
  config?: Record<string, unknown> | null;
  avatar_url?: string | null; // Optional override, else auto-generated
};

/**
 * Request model for updating AI entities.
 * PATCH /ai/entities/{id}
 */
export type AIEntityUpdate = AIEntityCreate & {
  status?: AIEntityStatus; // Update only
  current_room_id?: number | null; // Update only (room assignment)
  avatar_url?: string | null; // Optional override
};

/**
 * Compact AI response for room availability.
 * GET /ai/rooms/{room_id}/available
 */
export type AIAvailableResponse = {
  id: number;
  username: string;
  model_name: string;
  status: AIEntityStatus;
};

/**
 * Response for goodbye initiation.
 * POST /ai/entities/{id}/goodbye
 */
export type AIGoodbyeResponse = {
  message: string;
  ai_entity_id: number;
  conversation_id: number | null;
  room_id: number | null;
};

/**
 * UI helper: Room response strategy metadata for dropdowns/selects.
 */
export const ROOM_RESPONSE_STRATEGY_OPTIONS: Array<{
  value: RoomResponseStrategy;
  label: string;
  description: string;
}> = [
  {
    value: 'room_mention_only',
    label: 'Mention only',
    description: 'Respond on @mentions or when name is used.',
  },
  {
    value: 'room_probabilistic',
    label: 'Probabilistic',
    description: 'Respond randomly (needs probability).',
  },
  {
    value: 'room_active',
    label: 'Active',
    description: 'Respond to almost every message.',
  },
  {
    value: 'no_response',
    label: 'Disabled',
    description: 'Never respond in rooms.',
  },
];

/**
 * UI helper: Conversation response strategy metadata for dropdowns/selects.
 */
export const CONVERSATION_RESPONSE_STRATEGY_OPTIONS: Array<{
  value: ConversationResponseStrategy;
  label: string;
  description: string;
}> = [
  {
    value: 'conv_every_message',
    label: 'Every message',
    description: 'Reply to every message.',
  },
  {
    value: 'conv_on_questions',
    label: 'Questions',
    description: 'Reply to questions or interrogatives.',
  },
  {
    value: 'conv_smart',
    label: 'Smart',
    description: 'Reply when asked or when mentioned.',
  },
  {
    value: 'no_response',
    label: 'Disabled',
    description: 'Never respond in conversations.',
  },
];
