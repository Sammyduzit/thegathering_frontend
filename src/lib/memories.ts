export type MemoryResponse = {
  id: number;
  entity_id: number;
  conversation_id: number | null;
  room_id: number | null;
  summary: string;
  memory_content: Record<string, unknown>;
  keywords: string[];
  importance_score: number;
  embedding: number[] | null;
  access_count: number;
  memory_metadata: Record<string, unknown> | null;
  created_at: string;
  last_accessed: string | null;
};

/**
 * Fact-based Memory Content (automatically created during conversation archive)
 * Structured format with extracted facts, themes, and participants.
 */
export type FactBasedMemoryContent = {
  fact: {
    text: string;
    importance: number;
    participants: string[];
    theme: string;
  };
  conversation_id: number;
  chunk_index: number;
  message_range: string;
  message_ids: number[];
};

/**
 * Text-based Memory Content (manually created or personality data)
 * Simple format with full text content.
 */
export type TextBasedMemoryContent = {
  full_text: string;
};

/**
 * Type guard: Check if memory is a fact-based long-term memory.
 * These are automatically created during conversation archiving.
 */
export function isFactBasedMemory(memory: MemoryResponse): boolean {
  const metadata = memory.memory_metadata as { type?: string } | null;
  const content = memory.memory_content as Record<string, unknown>;
  return metadata?.type === "long_term" && "fact" in content;
}

/**
 * Type guard: Check if memory is a text-based memory.
 * These include manually created long-term memories and personality data.
 */
export function isTextBasedMemory(memory: MemoryResponse): boolean {
  const metadata = memory.memory_metadata as { type?: string } | null;
  const content = memory.memory_content as Record<string, unknown>;
  return (metadata?.type === "long_term" || metadata?.type === "personality") && "full_text" in content;
}

export type MemoryListResponse = {
  memories: MemoryResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type MemoryFormState = {
  entity_id: string;
  conversation_id: string;
  room_id: string;
  summary: string;
  memory_content: string;
  keywords: string;
  importance_score: string;
  memory_metadata: string;
};

export function memoryToFormState(memory: MemoryResponse): MemoryFormState {
  return {
    entity_id: String(memory.entity_id),
    conversation_id: memory.conversation_id !== null ? String(memory.conversation_id) : "",
    room_id: memory.room_id !== null ? String(memory.room_id) : "",
    summary: memory.summary,
    memory_content: JSON.stringify(memory.memory_content, null, 2),
    keywords: memory.keywords.join(", "),
    importance_score: String(memory.importance_score),
    memory_metadata: memory.memory_metadata ? JSON.stringify(memory.memory_metadata, null, 2) : "",
  };
}

export function emptyFormState(entityId?: number): MemoryFormState {
  return {
    entity_id: entityId ? String(entityId) : "",
    conversation_id: "",
    room_id: "",
    summary: "",
    memory_content: "{}",
    keywords: "",
    importance_score: "5",
    memory_metadata: "",
  };
}

export function parseInteger(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer.`);
  }
  return parsed;
}

export function parseOptionalInteger(value: string, field: string): number | null {
  if (!value.trim()) return null;
  return parseInteger(value, field);
}

export function parseJSON(value: string, field: string): Record<string, unknown> {
  if (!value.trim()) {
    throw new Error(`${field} cannot be empty.`);
  }
  return JSON.parse(value);
}

export function parseOptionalJSON(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null;
  return JSON.parse(value);
}

export function parseKeywords(value: string): string[] | undefined {
  if (!value.trim()) return undefined;
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function parseImportance(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Importance score must be a number between 0.0 and 10.0.");
  }
  if (parsed < 0 || parsed > 10) {
    throw new Error("Importance score must be between 0.0 and 10.0.");
  }
  return parsed;
}

// ============================================================================
// API Client Functions
// ============================================================================

import { apiFetch } from './client-api';
import { MEMORY_CONFIG } from './constants';

/**
 * Request model for creating manual long-term memory (context-aware).
 * POST /api/memories
 */
export type MemoryCreateRequest = {
  entity_id: number;
  conversation_id: number;
  user_ids: number[]; // From conversation.participants (non-AI)
  text: string; // Max 500 chars, format: "username: msg\n\nusername: msg"
  keywords?: string[] | null;
};

/**
 * Request model for updating memory.
 * PATCH /api/memories/{memoryId}
 */
export type MemoryUpdateRequest = {
  text?: string; // Regenerates embedding if changed
  keywords?: string[];
  importance_score?: number;
};

/**
 * Request model for personality upload.
 * POST /api/memories/admin/ai-entities/{entityId}/personality
 */
export type PersonalityUploadRequest = {
  text: string;
  category: string;
  metadata?: Record<string, unknown>;
};

/**
 * Response for personality upload.
 */
export type PersonalityUploadResponse = {
  created_memories: number;
  memory_ids: number[];
  category: string;
  chunks: number;
};

/**
 * Create manual long-term memory (context-aware).
 * Requires: entity_id, conversation_id, user_ids, text
 *
 * @example
 * ```ts
 * const memory = await createMemory({
 *   entity_id: 1,
 *   conversation_id: 5,
 *   user_ids: [1, 2],
 *   text: "testadmin: Ich denke über X nach\n\nAssistant Alpha: Das ist interessant...",
 * });
 * ```
 */
export async function createMemory(request: MemoryCreateRequest): Promise<MemoryResponse> {
  const { data } = await apiFetch<MemoryResponse>('/api/memories', {
    method: 'POST',
    body: request,
  });
  return data;
}

/**
 * List memories with filters.
 *
 * @param params - Filter parameters
 * @returns Paginated list of memories
 *
 * @example
 * ```ts
 * const memories = await listMemories({
 *   entity_id: 1,
 *   conversation_id: 5,
 *   include_short_term: false,
 *   page: 1,
 *   page_size: 50,
 * });
 * ```
 */
export async function listMemories(params: {
  entity_id?: number;
  conversation_id?: number;
  include_short_term?: boolean;
  page?: number;
  page_size?: number;
}): Promise<MemoryListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const { data } = await apiFetch<MemoryListResponse>(`/api/memories?${query}`);
  return data;
}

/**
 * Get single memory by ID.
 *
 * @param memoryId - Memory ID
 * @returns Memory details
 */
export async function getMemory(memoryId: number): Promise<MemoryResponse> {
  const { data } = await apiFetch<MemoryResponse>(`/api/memories/${memoryId}`);
  return data;
}

/**
 * Update memory (regenerates embedding if text changed).
 *
 * @param memoryId - Memory ID
 * @param update - Fields to update
 * @returns Updated memory
 *
 * @example
 * ```ts
 * const updated = await updateMemory(123, {
 *   text: "Updated text...",
 *   keywords: ["new", "keywords"],
 * });
 * ```
 */
export async function updateMemory(
  memoryId: number,
  update: MemoryUpdateRequest
): Promise<MemoryResponse> {
  const { data } = await apiFetch<MemoryResponse>(`/api/memories/${memoryId}`, {
    method: 'PATCH',
    body: update,
  });
  return data;
}

/**
 * Delete memory (hard delete).
 *
 * @param memoryId - Memory ID
 *
 * @example
 * ```ts
 * await deleteMemory(123);
 * ```
 */
export async function deleteMemory(memoryId: number): Promise<void> {
  await apiFetch(`/api/memories/${memoryId}`, {
    method: 'DELETE',
    expectJson: false,
  });
}

/**
 * Upload personality (large text → auto-chunked + embedded).
 * Creates global memories (user_ids=[], conversation_id=null).
 *
 * @param entityId - AI Entity ID
 * @param request - Personality upload data
 * @returns Upload statistics
 *
 * @example
 * ```ts
 * const result = await uploadPersonality(1, {
 *   text: "Large text content...",
 *   category: "books",
 *   metadata: { book_title: "Harry Potter", chapter: 1 },
 * });
 * console.log(`Created ${result.created_memories} memories`);
 * ```
 */
export async function uploadPersonality(
  entityId: number,
  request: PersonalityUploadRequest
): Promise<PersonalityUploadResponse> {
  const { data } = await apiFetch<PersonalityUploadResponse>(
    `/api/memories/admin/ai-entities/${entityId}/personality`,
    {
      method: 'POST',
      body: request,
    }
  );
  return data;
}

/**
 * Search memories by keywords.
 *
 * @param params - Search parameters
 * @returns Matching memories
 *
 * @example
 * ```ts
 * const results = await searchMemories({
 *   entity_id: 1,
 *   keywords: "python,fastapi",
 *   limit: 10,
 * });
 * ```
 */
export async function searchMemories(params: {
  entity_id?: number;
  keywords: string;
  limit?: number;
}): Promise<MemoryResponse[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const { data } = await apiFetch<MemoryResponse[]>(`/api/memories/search?${query}`);
  return data;
}

/**
 * Memory configuration constants from backend.
 * MUST match backend settings in .env
 */
export { MEMORY_CONFIG };
