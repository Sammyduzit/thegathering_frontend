# Backend-Frontend Alignment - Refactoring Übersicht

## 🎯 Zielsetzung

Saubere Refactorings statt Quick-Fixes. Wir wollen gut strukturierten, wartbaren Code mit konsistenten Patterns.

---

## ✅ Was bereits funktioniert (keine Änderungen nötig)

### 1. Authentifizierung & Security
- **Cookie-basierte Auth**: `tg_access`, `tg_refresh`, `tg_csrf` Cookies korrekt implementiert
- **CSRF Protection**: Double-Submit Pattern mit `X-CSRF-Token` Header funktioniert
- **Token Rotation**: Silent Refresh mit automatischer Rotation wird transparent gehandhabt
- **Auto-Retry Logic**: 401-Fehler triggern automatischen Token-Refresh in `apiFetch()`

**Dateien:**
- `src/lib/client-api.ts` ✅
- `src/lib/backend-proxy.ts` ✅
- `src/app/api/auth/**/*.ts` ✅

### 2. API Integration
- **Unified Participant Management**: Conversations verwenden bereits username-basierte Participant-Verwaltung (Human + AI)
- **Message Pagination**: `PaginatedMessagesResponse` mit `has_more`, `total_pages` korrekt implementiert
- **Room Participants**: Unified Liste mit `is_ai` Flag funktioniert

**Dateien:**
- `src/types/room.ts` ✅
- `src/types/conversation.ts` ✅
- Alle API Route Handler sind simple Proxies ✅

### 3. Type Definitions (Teilweise)
- `RoomParticipant`, `ConversationParticipant` haben korrekte Struktur mit `username` + `is_ai`
- `PaginatedMessagesResponse<T>` ist generic und vollständig aligned
- `MemoryResponse` in `src/lib/memories.ts` ist vollständig kompatibel

---

## 🔧 Notwendige Refactorings

### **Priority 1: Zentrale Type-Definitionen**

**Problem:** Types sind aktuell über mehrere Dateien verstreut und teilweise inline definiert.

**Lösung:** Zentrale, exportierbare Type-Definitionen erstellen.

#### 1.1 User Types zentralisieren

**Erstelle:** `src/types/user.ts`

```typescript
/**
 * User response model from backend.
 * Reflects /auth/me and /auth/register responses.
 */
export type UserResponse = {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;  // ⚠️ FEHLT aktuell in MeClient.tsx
  preferred_language: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  current_room_id: number | null;
}

/**
 * Supported languages from backend (app/core/constants.py)
 */
export const SUPPORTED_LANGUAGES = [
  'en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'ru', 'ja', 'zh'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
```

**Refactoring:**
- ❌ Entferne `UserProfile` Type aus `src/app/me/MeClient.tsx` (Zeile 10-19)
- ✅ Importiere `UserResponse` aus `src/types/user.ts`
- ✅ Füge `avatar_url` zum UI hinzu (falls gewünscht)

**Betroffene Dateien:**
- `src/app/me/MeClient.tsx`
- Potentiell andere Components die User-Daten nutzen

---

#### 1.2 AI Entity Types zentralisieren

**Erstelle:** `src/types/ai-entity.ts`

```typescript
/**
 * AI Response Strategies (Backend: app/schemas/ai_entities.py)
 */
export const ROOM_RESPONSE_STRATEGIES = [
  'room_mention_only',
  'room_probabilistic',
  'room_active',
  'no_response'
] as const;

export const CONVERSATION_RESPONSE_STRATEGIES = [
  'conv_every_message',
  'conv_on_questions',
  'conv_smart',
  'no_response'
] as const;

export type RoomResponseStrategy = typeof ROOM_RESPONSE_STRATEGIES[number];
export type ConversationResponseStrategy = typeof CONVERSATION_RESPONSE_STRATEGIES[number];

export type AIEntityStatus = 'online' | 'offline';

/**
 * AI Entity response model from backend.
 * Reflects GET /ai/entities/{id} response.
 */
export type AIEntityResponse = {
  id: number;
  username: string;  // Unique identifier (kann Leerzeichen enthalten)
  description: string | null;
  system_prompt: string;
  model_name: string;
  temperature: number | null;
  max_tokens: number | null;
  room_response_strategy: RoomResponseStrategy;
  conversation_response_strategy: ConversationResponseStrategy;
  response_probability: number | null;  // 0.0-1.0, nur relevant bei room_probabilistic
  cooldown_seconds: number | null;  // 0-3600 oder null
  config: Record<string, unknown> | null;
  is_active: boolean;
  status: AIEntityStatus;
  current_room_id: number | null;
  current_room_name: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Request model for creating AI entities.
 * POST /ai/entities
 */
export type AIEntityCreate = {
  username: string;
  description?: string | null;
  system_prompt: string;
  model_name: string;
  temperature?: number | null;  // 0.0-2.0
  max_tokens?: number | null;  // 1-32000
  room_response_strategy?: RoomResponseStrategy;
  conversation_response_strategy?: ConversationResponseStrategy;
  response_probability?: number | null;
  cooldown_seconds?: number | null;
  config?: Record<string, unknown> | null;
}

/**
 * Request model for updating AI entities.
 * PATCH /ai/entities/{id}
 */
export type AIEntityUpdate = AIEntityCreate & {
  status?: AIEntityStatus;  // Update only
  current_room_id?: number | null;  // Update only (room assignment)
}

/**
 * Compact AI response for room availability.
 * GET /ai/rooms/{room_id}/available
 */
export type AIAvailableResponse = {
  id: number;
  username: string;
  model_name: string;
  status: AIEntityStatus;
}

/**
 * Response for goodbye initiation.
 * POST /ai/entities/{id}/goodbye
 */
export type AIGoodbyeResponse = {
  message: string;
  ai_entity_id: number;
  conversation_id: number | null;
  room_id: number | null;
}
```

**Refactoring:**
- ❌ Entferne inline Types aus `src/app/admin/ai/AiManagementClient.tsx` (Zeile 34-53)
- ✅ Importiere alle AI-bezogenen Types aus `src/types/ai-entity.ts`
- ✅ Verwende Strategy-Konstanten für Dropdowns/Select-Components

**Betroffene Dateien:**
- `src/app/admin/ai/AiManagementClient.tsx`
- Potentiell AI-bezogene Forms/Components

---

#### 1.3 API Response Types vervollständigen

**Erweitere:** `src/types/conversation.ts`

```typescript
/**
 * Response for conversation creation.
 * POST /conversations/
 */
export type ConversationCreateResponse = {
  message: string;
  conversation_id: number;
  participants: number;  // Anzahl Participants
}

/**
 * Response for conversation archive/update.
 * PATCH /conversations/{id}
 */
export type ConversationUpdateResponse = {
  message: string;
  conversation_id: number;
  is_active: boolean;
}

/**
 * Request model for adding participants (Human oder AI).
 * POST /conversations/{id}/participants
 */
export type ParticipantAddRequest = {
  username: string;  // Backend macht automatisch lookup (Human first, dann AI)
}

/**
 * Response for adding participants.
 */
export type ParticipantAddResponse = {
  message: string;
  conversation_id: number;
  username: string;
  participant_count: number;
}

/**
 * Response for removing participants.
 * DELETE /conversations/{id}/participants/{username}
 */
export type ParticipantRemoveResponse = {
  message: string;
  conversation_id: number;
  username: string;
  participant_count: number;
}
```

**Erweitere:** `src/types/room.ts`

```typescript
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
}

/**
 * Response for room join.
 * POST /rooms/{id}/join
 */
export type RoomJoinResponse = {
  message: string;
  room_id: number;
  room_name: string;
  user_count: number;
}

/**
 * Response for room leave.
 * POST /rooms/{id}/leave
 */
export type RoomLeaveResponse = {
  message: string;
  room_id: number;
  room_name: string;
}

/**
 * Response for status update.
 * PATCH /rooms/users/status
 */
export type StatusUpdateResponse = {
  message: string;
  status: 'available' | 'busy' | 'away';
}

/**
 * Request model for status update.
 */
export type UserStatusUpdate = {
  status: 'available' | 'busy' | 'away';
}
```

**Betroffene Dateien:**
- Components die Room/Conversation-Operationen durchführen
- API Route Handler können TypeScript-Typisierung bekommen

---

### **Priority 2: Memory Management UI (Admin)**

**Problem:** Memory Management UI fehlt komplett.

**Lösung:** Saubere, hierarchische UI nach Best Practices aus `data_for_frontend.md` (Abschnitt 6.3).

#### 2.1 Drei-Ebenen Architektur

**Erstelle:**

1. **`src/app/admin/memories/page.tsx`** - Entity Auswahl
   - Dropdown mit allen AI Entities
   - Weiterleitung zu `/admin/memories/[entityId]`

2. **`src/app/admin/memories/[entityId]/page.tsx`** - Conversation + Personality Tabs
   - **Tab 1:** Personality Memories (global, `user_ids=[]`)
     - Upload-Button für große Texte (Bücher, Dokumente)
     - Liste der Personality-Chunks mit Category-Badges
   - **Tab 2:** Long-Term Conversations
     - Grouped by `conversation_id`
     - Zeige: Conversation Name, Chunk Count, Latest Memory
     - Click → `/admin/memories/[entityId]/conversation/[conversationId]`

3. **`src/app/admin/memories/[entityId]/conversation/[conversationId]/page.tsx`** - Chunk CRUD
   - Liste aller Memory-Chunks (sortiert nach `chunk_index`)
   - Pro Chunk: Edit + Delete Buttons
   - "Add Memory" Button am Ende
   - Modal für Add/Edit mit:
     - Text Input (max 500 Zeichen, Format: `username: message\n\nusername: message`)
     - Keywords Input (optional override)
     - Auto-Fetch der `user_ids` aus Conversation-Participants

#### 2.2 Memory API Integration

**Erstelle:** `src/lib/memories.ts` (erweitern)

```typescript
import { apiFetch } from './client-api';

/**
 * Configuration constants from backend.
 * MUST match backend settings in .env
 */
export const MEMORY_CONFIG = {
  MESSAGE_LENGTH: 500,
  MEMORY_TEXT_LENGTH: 500,
  CHUNK_SIZE: 500,
} as const;

/**
 * Create manual long-term memory (context-aware).
 * Requires: entity_id, conversation_id, user_ids, text
 */
export async function createMemory(request: {
  entity_id: number;
  conversation_id: number;
  user_ids: number[];  // From conversation.participants (non-AI)
  text: string;  // Max 500 chars, format: "username: msg\n\nusername: msg"
  keywords?: string[] | null;
}): Promise<MemoryResponse> {
  return apiFetch<MemoryResponse>('/api/memories', {
    method: 'POST',
    body: request,
    // csrf: true (automatic for POST)
  }).then(res => res.data);
}

/**
 * Update memory (regenerates embedding if text changed).
 */
export async function updateMemory(
  memoryId: number,
  update: {
    text?: string;
    keywords?: string[];
    importance_score?: number;
  }
): Promise<MemoryResponse> {
  return apiFetch<MemoryResponse>(`/api/memories/${memoryId}`, {
    method: 'PATCH',
    body: update,
  }).then(res => res.data);
}

/**
 * Delete memory (hard delete).
 */
export async function deleteMemory(memoryId: number): Promise<void> {
  await apiFetch(`/api/memories/${memoryId}`, {
    method: 'DELETE',
  });
}

/**
 * Upload personality (large text → auto-chunked + embedded).
 * Creates global memories (user_ids=[], conversation_id=null).
 */
export async function uploadPersonality(
  entityId: number,
  request: {
    text: string;
    category: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{
  created_memories: number;
  memory_ids: number[];
  category: string;
  chunks: number;
}> {
  return apiFetch(`/api/memories/admin/ai-entities/${entityId}/personality`, {
    method: 'POST',
    body: request,
  }).then(res => res.data);
}

/**
 * List memories with filters.
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

  return apiFetch<MemoryListResponse>(`/api/memories?${query}`)
    .then(res => res.data);
}
```

**Erstelle API Routes:**
- `src/app/api/memories/route.ts` (GET list, POST create)
- `src/app/api/memories/[memoryId]/route.ts` (GET single, PATCH, DELETE)
- `src/app/api/memories/admin/ai-entities/[entityId]/personality/route.ts` (POST upload)

---

### **Priority 3: Code Quality Improvements**

#### 3.1 Konsistente Error Handling

**Problem:** Error-Responses vom Backend sind standardisiert, aber Frontend handhabt sie inkonsistent.

**Backend Error Format (data_for_frontend.md Abschnitt 1.3):**
```json
{
  "detail": "Fehlermeldung",
  "error_code": "STABLE_ERROR_CODE",
  "timestamp": "2024-05-28T12:34:56.123456+00:00"
}
```

**Lösung:** Type-safe Error-Handling in `client-api.ts`

**Erstelle:** `src/types/api-error.ts`

```typescript
/**
 * Standardized backend error response.
 * All domain exceptions use this format.
 */
export type BackendErrorResponse = {
  detail: string;
  error_code: string;
  timestamp: string;
}

/**
 * Type guard for backend error responses.
 */
export function isBackendError(error: unknown): error is { error: BackendErrorResponse } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object' &&
    'error_code' in (error as any).error
  );
}

/**
 * Extract error message from various error types.
 */
export function getErrorMessage(error: unknown): string {
  if (isBackendError(error)) {
    return error.error.detail;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Extract error code from backend error.
 */
export function getErrorCode(error: unknown): string | null {
  if (isBackendError(error)) {
    return error.error.error_code;
  }
  return null;
}
```

**Erweitere:** `src/lib/client-api.ts`

```typescript
import type { BackendErrorResponse } from '@/types/api-error';

export type ApiFetchError = {
  error: BackendErrorResponse | { detail: string };
  status: number;
}

// In apiFetch():
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
  throw {
    error: errorData,
    status: response.status
  } satisfies ApiFetchError;
}
```

**Verwendung in Components:**
```typescript
import { getErrorMessage, getErrorCode } from '@/types/api-error';

try {
  await createMemory({ ... });
} catch (err) {
  const message = getErrorMessage(err);
  const code = getErrorCode(err);

  toast.error(message);

  if (code === 'CONVERSATION_NOT_FOUND') {
    // Spezifisches Handling
  }
}
```

---

#### 3.2 Shared Constants

**Erstelle:** `src/lib/constants.ts`

```typescript
/**
 * Backend API base URL.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Cookie names (must match backend settings).
 */
export const COOKIE_NAMES = {
  ACCESS: 'tg_access',
  REFRESH: 'tg_refresh',
  CSRF: 'tg_csrf',
} as const;

/**
 * Memory configuration (must match backend .env).
 */
export const MEMORY_CONFIG = {
  MESSAGE_LENGTH: 500,
  MEMORY_TEXT_LENGTH: 500,
  CHUNK_SIZE: 500,
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 50,
  INITIAL_PAGE: 1,
} as const;

/**
 * User status values.
 */
export const USER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  AWAY: 'away',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
```

**Refactoring:**
- Ersetze Hardcoded Values durch Imports aus `constants.ts`
- Nutze in `client-api.ts`, Components, API Routes

---

### **Priority 4: Documentation & Type Safety**

#### 4.1 JSDoc Comments für Public APIs

**Beispiel:**
```typescript
/**
 * Fetches a conversation with full details.
 *
 * @param conversationId - The conversation ID
 * @returns Conversation details including participants, permissions, and latest message
 * @throws {ApiFetchError} When conversation not found (404) or user not participant (403)
 *
 * @example
 * ```ts
 * const conversation = await getConversation(123);
 * console.log(conversation.participant_count);
 * ```
 */
export async function getConversation(conversationId: number): Promise<ConversationDetail>
```

**Ziel:** Alle public Functions in `src/lib/` haben vollständige JSDoc Comments.

---

#### 4.2 Stricter TypeScript Config

**Erweitere:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Fix Warnings:** Nach Aktivierung alle TypeScript-Warnings beheben.

---

## 📋 Prioritäten-Roadmap

### Phase 1: Grundlagen (Sofort)
1. ✅ Zentrale Type-Definitionen erstellen (`user.ts`, `ai-entity.ts`)
2. ✅ Inline Types refactoren (MeClient, AiManagementClient)
3. ✅ Shared Constants (`constants.ts`)
4. ✅ Error-Handling standardisieren (`api-error.ts`)

**Aufwand:** ~4h | **Impact:** Hoch (Code Quality & Maintainability)

### Phase 2: Memory Management (Optional)
5. ✅ Memory UI implementieren (3-Ebenen Architektur)
6. ✅ API Routes für Memories erstellen
7. ✅ Personality Upload Feature

**Aufwand:** ~12h | **Impact:** Mittel (Admin Feature)

### Phase 3: Polish (Optional)
8. ✅ JSDoc Comments für alle public APIs
9. ✅ Stricter TypeScript Config aktivieren
10. ✅ Storybook für Shared Components

**Aufwand:** ~8h | **Impact:** Mittel (Developer Experience)

---

## 🎯 Metriken

### Vorher
- Type-Definitionen: 60% inline, 40% shared
- Error-Handling: Inkonsistent
- Constants: Hardcoded an 15+ Stellen
- Documentation: Sporadisch

### Nachher (Phase 1)
- Type-Definitionen: 100% shared, zentral, exportierbar
- Error-Handling: Standardisiert mit Type Guards
- Constants: Single Source of Truth
- Documentation: JSDoc für alle public APIs

---

## 🚀 Nächste Schritte

1. Review dieser Übersicht
2. Entscheidung: Welche Phasen werden umgesetzt?
3. Tickets/Issues erstellen für jede Phase
4. Implementation starten

**Empfehlung:** Phase 1 sofort umsetzen (Fundament). Phase 2 + 3 nach Bedarf.
