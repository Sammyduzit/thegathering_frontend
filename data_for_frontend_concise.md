# Frontend-Anbindungsdokumentation für "The Gathering 2"

API-Informationen für die Frontend-Integration. Alle Angaben beziehen sich auf `app/`.

## 1. API-Grundlagen

### 1.1 Basis-URL

- Dev (Docker): `http://localhost:8000/api/v1`
- Prod: `https://api.the-gathering2.com/api/v1`

### 1.2 Authentifizierung

**Cookie-basiert (Primary):**

| Cookie | Inhalt | HttpOnly | Lebensdauer |
|--------|--------|----------|-------------|
| `tg_access` | JWT Access Token | Ja | 30 Min |
| `tg_refresh` | JWT Refresh Token | Ja | 7 Tage |
| `tg_csrf` | CSRF Token | Nein | 7 Tage |

**CSRF Protection:**
- Alle POST/PUT/PATCH/DELETE benötigen Header: `X-CSRF-Token: <wert_aus_tg_csrf_cookie>`
- Ausnahmen: `/auth/login`, `/auth/register`, `/auth/refresh`

**Header-basiert (Fallback für Swagger/Mobile):**
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 1.3 Fehlerformat

```json
{
  "detail": "Fehlermeldung",
  "error_code": "STABLE_ERROR_CODE",
  "timestamp": "2024-05-28T12:34:56+00:00"
}
```

### 1.4 CORS

- Dev Origins: `http://localhost:3000`, `http://127.0.0.1:3000`
- `allow_credentials: true`

## 2. Benutzer & Authentifizierung

### 2.1 UserResponse

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "coder",
  "avatar_url": "https://...",
  "preferred_language": "en",
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-05-28T12:00:00+00:00",
  "last_active": "2024-05-28T12:05:00+00:00",
  "current_room_id": 3,
  "weekly_message_count": 15,
  "weekly_message_limit": 100,
  "weekly_reset_date": "2024-05-28T00:00:00+00:00"
}
```

**Wichtige Felder:**
- `preferred_language`: en, de, fr, es, it, nl, pl, pt, ru, ja, zh
- `weekly_message_limit`: -1 = unbegrenzt (Admin)
- `current_room_id`: null = nicht in Raum

### 2.2 Endpunkte

| Endpoint | Method | Body | CSRF | Beschreibung |
|----------|--------|------|------|--------------|
| `/auth/register` | POST | `{email, username, password}` | Nein | User erstellen |
| `/auth/login` | POST | `{email, password}` | Nein | Login (setzt 3 Cookies) |
| `/auth/refresh` | POST | - | Nein | Token rotieren (Single-Use Pattern) |
| `/auth/logout` | POST | - | Ja | Logout + Token Family Revocation |
| `/auth/me` | GET | - | Nein | Aktueller User |
| `/auth/me` | PATCH | `{preferred_language?, username?}` | Ja | User updaten |
| `/auth/users/me/quota` | GET | - | Nein | Quota-Status |
| `/auth/admin/users/quota-exceeded` | GET | - | Nein | Quota-Überschreitungen (Admin) |

**Login Response:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800
}
```
Plus 3 Cookies: `tg_access`, `tg_refresh`, `tg_csrf`

**Quota Response:**
```json
{
  "weekly_limit": 100,
  "used": 15,
  "remaining": 85,
  "last_reset_date": "2024-05-28T00:00:00+00:00",
  "next_reset_date": "2024-06-04T00:00:00+00:00",
  "percentage_used": 15.0
}
```

**Token Rotation (OWASP 2025):**
- Jeder Refresh → neuer `tg_access` + neuer `tg_refresh` (alter wird ungültig)
- Reuse Detection: Wiederverwendung alten Tokens → alle Sessions revoked
- Logout revoked komplette Token Family

## 3. Räume

### 3.1 RoomResponse

```json
{
  "id": 5,
  "name": "Main Hall",
  "description": "Willkommensraum",
  "max_users": 20,
  "is_translation_enabled": true,
  "is_active": true,
  "has_ai": false,
  "created_at": "2024-05-28T12:00:00+00:00"
}
```

### 3.2 Endpunkte

**Admin (CRUD):**
- `POST /rooms/` – Raum erstellen (CSRF)
- `PUT /rooms/{id}` – Raum updaten (CSRF)
- `DELETE /rooms/{id}` – Raum löschen (CSRF, **hard delete** Room Messages)

**Public:**
- `GET /rooms/` – Alle aktiven Räume
- `GET /rooms/{id}` – Einzelner Raum
- `POST /rooms/{id}/join` – Raum beitreten (CSRF, setzt `current_room_id`)
- `POST /rooms/{id}/leave` – Raum verlassen (CSRF)
- `GET /rooms/{id}/participants` – Unified Participant-Liste (Humans + AI)
- `PATCH /rooms/users/status` – Status updaten (CSRF)

**RoomParticipantsResponse:**
```json
{
  "room_id": 5,
  "room_name": "Main Hall",
  "total_participants": 4,
  "participants": [
    {
      "id": 1,
      "username": "alice",
      "avatar_url": "https://...",
      "status": "available",
      "is_ai": false,
      "last_active": "2024-05-28T12:05:00+00:00"
    },
    {
      "id": 2,
      "username": "Bot Beta",
      "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Bot%20Beta",
      "status": "online",
      "is_ai": true,
      "last_active": null
    }
  ]
}
```

### 3.3 Room Messages

**MessageResponse:**
```json
{
  "id": 42,
  "sender_id": 7,
  "sender_username": "bob",
  "content": "Hallo zusammen!",
  "message_type": "TEXT",
  "sent_at": "2024-05-28T12:10:00+00:00",
  "room_id": 5,
  "conversation_id": null
}
```

**Endpoints:**
- `POST /rooms/{id}/messages` – Nachricht senden (CSRF, Quota-Check, **429** bei Limit)
- `GET /rooms/{id}/messages?page=1&page_size=50` – Nachrichten laden (DESC, neueste zuerst)

**PaginatedMessagesResponse:**
```json
{
  "messages": [MessageResponse, ...],
  "total": 142,
  "page": 1,
  "page_size": 50,
  "total_pages": 3,
  "has_more": true
}
```

## 4. Konversationen

### 4.1 Datenmodelle

**ConversationCreate:**
```json
{
  "participant_usernames": ["bob", "carol", "sophia"],
  "conversation_type": "group"
}
```

**Wichtig:**
- `participant_usernames`: Mixed (Human + AI), Backend erkennt automatisch
- Creator muss in Raum sein (`current_room_id` gesetzt)
- **Private:** Genau 1 weiterer Participant (Human oder AI)
- **Group:** Mindestens 1 weiterer Participant (Human oder AI)

**ConversationListItemResponse (Übersicht):**
```json
{
  "id": 12,
  "type": "group",
  "room_id": 5,
  "room_name": "Main Hall",
  "participants": ["bob", "carol"],
  "participant_count": 3,
  "created_at": "2024-05-28T12:15:00+00:00",
  "latest_message_at": "2024-05-28T14:30:00+00:00",
  "latest_message_preview": "Hey everyone..."
}
```

**ConversationDetailResponse (Detail):**
```json
{
  "id": 12,
  "type": "group",
  "room_id": 5,
  "room_name": "Main Hall",
  "is_active": true,
  "created_at": "2024-05-28T12:15:00+00:00",
  "participants": [
    {
      "id": 7,
      "username": "bob",
      "avatar_url": "https://...",
      "status": "available",
      "is_ai": false
    }
  ],
  "participant_count": 3,
  "message_count": 42,
  "latest_message": {MessageResponse},
  "permissions": {
    "can_post": true,
    "can_manage_participants": true,
    "can_leave": true
  }
}
```

### 4.2 Endpunkte

**Conversation Management:**

| Endpoint | Method | CSRF | Beschreibung |
|----------|--------|------|--------------|
| `/conversations/` | POST | Ja | Erstellen (mixed Humans/AI) |
| `/conversations/` | GET | Nein | Liste (nur aktive) |
| `/conversations/{id}` | GET | Nein | Details |
| `/conversations/{id}` | PATCH | Ja | Archive/Unarchive (`is_active`) |
| `/conversations/{id}` | DELETE | Ja | Archive (Alias, triggers LTM) |
| `/conversations/{id}/participants` | GET | Nein | Participants |
| `/conversations/{id}/participants` | POST | Ja | Add Participant (Human oder AI) |
| `/conversations/{id}/participants/{username}` | DELETE | Ja | Remove Participant |

**Messages:**
- `POST /conversations/{id}/messages` – Nachricht senden (CSRF, **201**, Quota-Check)
- `GET /conversations/{id}/messages?page=1&page_size=50` – Nachrichten (DESC)

**Archive/Unarchive:**
```json
// PATCH /conversations/{id}
{"is_active": false}  // Archive
{"is_active": true}   // Unarchive
```

**Participant Management:**
- **Add:** `POST /conversations/{id}/participants` mit `{"username": "alice"}`
- **Remove:** `DELETE /conversations/{id}/participants/{username}`
- **Self-Leave:** User können sich selbst entfernen
- **Admin-Only:** Andere User/AI entfernen
- **Auto-Archive:** Letzter Participant → `is_active = false`

## 5. AI-Entitäten

### 5.1 AIEntityResponse

```json
{
  "id": 4,
  "username": "sophia",
  "description": "Hilfreicher AI-Assistent",
  "system_prompt": "You are...",
  "model_name": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1024,
  "room_response_strategy": "room_mention_only",
  "conversation_response_strategy": "conv_on_questions",
  "response_probability": 0.3,
  "cooldown_seconds": 30,
  "config": {"memory_limit": 10},
  "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=sophia",
  "status": "online",
  "is_active": true,
  "current_room_id": 5,
  "current_room_name": "Main Hall",
  "created_at": "2024-05-27T18:00:00+00:00",
  "updated_at": "2024-05-28T09:30:00+00:00"
}
```

**Neue Felder:**
- `avatar_url`: Auto-generiert (DiceBear, Style: "bottts"), optional überschreibbar
- `cooldown_seconds`: null = kein Cooldown, 0-3600 = Rate Limiting
- Response Strategies: Siehe unten

### 5.2 AI Response Strategies

**Room Strategies:**

| Strategy | Verhalten |
|----------|-----------|
| `room_mention_only` | Nur bei @mention/Name |
| `room_probabilistic` | Mit `response_probability` (0.0-1.0) |
| `room_active` | Fast jede Nachricht |
| `no_response` | Nie |

**Conversation Strategies:**

| Strategy | Verhalten |
|----------|-----------|
| `conv_every_message` | Jede Nachricht |
| `conv_on_questions` | Nur Fragen (?, "was", "wie", etc.) |
| `conv_smart` | Fragen ODER Erwähnung |
| `no_response` | Nie |

**Cooldown:** Gilt pro Kontext (Room/Conversation), Check läuft vor Strategy-Check.

### 5.3 Endpunkte (Admin-Only)

**GET (kein CSRF):**
- `GET /ai/entities` – Alle AIs
- `GET /ai/entities/available` – Nur aktive
- `GET /ai/entities/{id}` – Details
- `GET /ai/rooms/{id}/available` – Freie AIs für Raum

**State-Changing (CSRF):**
- `POST /ai/entities` – Erstellen (Status: offline)
- `PATCH /ai/entities/{id}` – Update (inkl. Room-Zuweisung)
- `DELETE /ai/entities/{id}` – Soft Delete
- `POST /ai/entities/{id}/goodbye` – Graceful Goodbye (LTM-Task)

**Hinweis:** Alte Endpoints `/ai/conversations/{id}/invite` entfernt → nutze unified `/conversations/{id}/participants`

## 6. AI Memories & RAG System

### 6.0 RAG Architecture

**Three-Layer Memory:**

| Layer | user_id | embedding | Trigger | TTL |
|-------|---------|-----------|---------|-----|
| Short-term | Set | No | Nach AI-Antwort (24er Chunks) | 7 Tage |
| Long-term | Set | Yes | Archive/AI-Leave (Fact Extraction) | - |
| Personality | NULL | Yes | Admin Upload | - |

**Retrieval:** Hybrid Search (Vector 70% + Keywords 30%), Two-level RRF Fusion

**RAG Config (`.env`):**

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| **Embedding & Vector** |||
| `ENABLE_VECTOR_SEARCH` | true | Vector retrieval aktivieren |
| `EMBEDDING_PROVIDER` | google | "google" oder "openai" |
| `EMBEDDING_MODEL` | gemini-embedding-001 | Model name |
| `EMBEDDING_DIMENSIONS` | 1536 | Vector dimensions |
| `VECTOR_SEARCH_WEIGHT` | 0.7 | Vector search weight |
| `KEYWORD_SEARCH_WEIGHT` | 0.3 | Keyword search weight |
| **Memory Retrieval** |||
| `TOTAL_MEMORY_LIMIT` | 10 | Max memories in context |
| `GUARANTEED_SHORT_TERM` | 2 | Min short-term memories |
| `GUARANTEED_LONG_TERM` | 2 | Min long-term memories |
| `GUARANTEED_PERSONALITY` | 1 | Min personality memories |
| `SHORT_TERM_WEIGHT` | 2.0 | Recency boost |
| `*_CANDIDATES` | 5 | Candidate limit per layer |
| **Short-Term** |||
| `SHORT_TERM_TTL_DAYS` | 7 | TTL für STM |
| **Long-Term Extraction** |||
| `LTM_PROVIDER` | google | "google" oder "openai" |
| `LTM_EXTRACTION_MODEL` | gemini-2.5-flash-lite | Fact extraction model |
| `LTM_EXTRACTION_TEMPERATURE` | 0.3 | Temperature |
| `LTM_MAX_FACTS_PER_CHUNK` | 10 | Max facts per chunk |
| `LTM_MIN_IMPORTANCE_THRESHOLD` | 0.3 | Min importance (0.0-1.0) |
| `LTM_EXTRACTION_MAX_RETRIES` | 3 | Retry count |
| **Keywords (YAKE)** |||
| `KEYWORD_LANGUAGE` | de | "de" oder "en" |
| `KEYWORD_MAX_NGRAMS` | 3 | Max n-gram size |
| `KEYWORD_TOP_N` | 20 | Candidate keywords |
| **RRF** |||
| `RRF_CONSTANT_K` | 60 | RRF constant |

### 6.1 MemoryResponse

**Long-Term (Fact-based, automatisch):**
```json
{
  "id": 9,
  "entity_id": 4,
  "conversation_id": 12,
  "room_id": null,
  "summary": "Philosophy",
  "memory_content": {
    "fact": {
      "text": "testadmin interested in determinism and free will",
      "importance": 0.8,
      "participants": ["testadmin"],
      "theme": "Philosophy"
    },
    "conversation_id": 12,
    "chunk_index": 0,
    "message_range": "0-23",
    "message_ids": [100, 101, 102]
  },
  "keywords": ["determinismus", "kant"],
  "importance_score": 0.8,
  "embedding": [0.123, ...],
  "access_count": 2,
  "memory_metadata": {
    "type": "long_term",
    "from_short_term": true,
    "fact_hash": "a3b2c1d4..."
  },
  "created_at": "2024-05-28T10:00:00+00:00",
  "last_accessed": "2024-05-28T10:05:00+00:00"
}
```

**Short-Term (Text-based, inline):**
```json
{
  "id": 8,
  "entity_id": 4,
  "conversation_id": 12,
  "summary": "testadmin: Ich denke über X nach...",
  "memory_content": {
    "messages": [
      {"message_id": 100, "sender_name": "testadmin", "content": "..."}
    ]
  },
  "keywords": ["philosophie"],
  "importance_score": 1.0,
  "embedding": null,
  "memory_metadata": {
    "type": "short_term",
    "chunk_index": 0,
    "message_range": "0-23"
  }
}
```

**Memory-Strukturen:**

| Typ | `memory_content` | Erstellung | Embedding | `importance_score` |
|-----|------------------|------------|-----------|-------------------|
| Short-Term | `messages` Array | Nach AI-Antwort | Nein | 1.0 |
| Long-Term (auto) | `fact` Object | ARQ-Task (Archive/Leave) | Ja | LLM (0.0-1.0) |
| Long-Term (manuell) | `full_text` String | POST /memories | Ja | 1.0 |
| Personality | `full_text` String | Admin Upload | Ja | Konfigurierbar |

### 6.2 Memory Endpoints (Admin)

**Automatic Creation:**
- **STM:** Nach jeder AI-Antwort (24er Chunks, inline)
- **LTM:** ARQ-Task bei Archive/AI-Leave (Fact Extraction via LLM)
  - Catch-up STM Chunks vor Extraktion
  - Max `LTM_MAX_FACTS_PER_CHUNK` Facts pro Chunk
  - Filtering: Score ≥ `LTM_MIN_IMPORTANCE_THRESHOLD`
  - Retry Logic: `LTM_EXTRACTION_MAX_RETRIES` mal
  - STM Cleanup nach erfolgreicher LTM-Erstellung

**Manual Creation:**
- `POST /memories` – Create LTM (Text-based, CSRF)

```json
{
  "entity_id": 1,
  "conversation_id": 5,
  "user_ids": [1, 2],  // REQUIRED
  "text": "username: message\n\nusername: message",
  "keywords": ["optional"]
}
```

**GET:**
- `GET /memories?entity_id=1&include_short_term=false` – Filter + Pagination
- `GET /memories/{id}` – Single Memory
- `GET /memories/search?entity_id=1&keywords=python` – Keyword Search

**State-Changing (CSRF):**
- `PATCH /memories/{id}` – Update (`summary`, `keywords`, `importance_score`)
- `DELETE /memories/{id}` – Hard Delete (204)
- `POST /memories/admin/ai-entities/{id}/personality` – Personality Upload

**Personality Upload:**
```json
{
  "text": "Large text...",
  "category": "books",
  "metadata": {"book_title": "Harry Potter"}
}
```

Response:
```json
{
  "created_memories": 234,
  "memory_ids": [1, 2, ...],
  "category": "books",
  "chunks": 234
}
```

## 7. Übersetzung

- Räume mit `is_translation_enabled = true` → Auto-Übersetzung
- Zielsprachen: `preferred_language` der Participants
- Room Messages: Serverseitig übersetzt beim Lesen
- Conversation Messages: Übersetzt gespeichert, aber noch nicht beim Lesen angewendet

## 8. Statuscodes

| Code | Bedeutung |
|------|-----------|
| 400 | Validation Error (Business-Ebene) |
| 401 | Ungültiges/fehlendes Token |
| 403 | Keine Berechtigung (Admin/Participant) |
| 404 | Ressource nicht gefunden |
| 409 | Duplikat (als 400 abgebildet) |
| 422 | Pydantic Validation Error |
| 429 | Quota exceeded |
| 500 | Unhandled Error |

## 9. Frontend Best Practices

### 9.1 Cookie Auth (Next.js)

**Login:**
```typescript
// Forward to FastAPI, Cookies weiterleiten
const response = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  credentials: 'include',
});

// Set-Cookie Headers an Client weiterleiten
const cookies = response.headers.getSetCookie();
const nextResponse = NextResponse.json(await response.json());
cookies.forEach(cookie => nextResponse.headers.append('Set-Cookie', cookie));
```

**CSRF-Token:**
```typescript
export function getCsrfToken(): string | null {
  const match = document.cookie.match(/tg_csrf=([^;]+)/);
  return match ? match[1] : null;
}

// Alle Mutations
fetch('/api/rooms/5/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken()!,
  },
  body: JSON.stringify({ content: 'Hello!' }),
  credentials: 'include',
});
```

**Silent Refresh (mit Rotation):**
```typescript
async function fetchWithAutoRefresh(url: string, options: RequestInit) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      response = await fetch(url, options);
    } else {
      window.location.href = '/login';
    }
  }

  return response;
}
```

**Token Rotation:**
- `/auth/refresh` rotiert **beide** Cookies (`tg_access` + `tg_refresh`)
- Alter Refresh-Token sofort ungültig (Single-Use)
- Reuse → `401 "Token reuse detected"` → Alle Sessions revoked

### 9.2 Pagination

**Initial Load:**
```typescript
const { messages, total, page, page_size, total_pages, has_more } =
  await fetch('/api/rooms/5/messages?page=1&page_size=50').then(r => r.json());
```

**Infinite Scroll:**
```typescript
if (has_more) {
  const nextPage = await fetch(`/api/rooms/5/messages?page=${page + 1}`);
}
```

**Hinweise:**
- Messages DESC (neueste zuerst) → für Chat-View clientseitig umkehren
- `has_more` für UI-Entscheidungen

### 9.3 Conversations

**Liste (Übersicht):**
```typescript
const conversations = await fetch('/api/conversations/');
// → ConversationListItemResponse[] mit latest_message_preview
```

**Detail:**
```typescript
const conversation = await fetch(`/api/conversations/${id}`);
// → ConversationDetailResponse mit Participants, Permissions

const { messages, has_more } =
  await fetch(`/api/conversations/${id}/messages?page=1`).then(r => r.json());
```

**Message Posting:**
```typescript
const response = await fetch(`/api/conversations/${id}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify({ content: 'Hello!' }),
  credentials: 'include',
});

if (response.status === 201) {
  const message = await response.json();
  // Add to UI immediately, AI response kommt später
}
```

**Archive:**
```typescript
// PATCH /conversations/{id}
await fetch(`/api/conversations/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify({ is_active: false }),
  credentials: 'include',
});

// DELETE ist Alias (REST-konform)
await fetch(`/api/conversations/${id}`, {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': getCsrfToken() },
  credentials: 'include',
});
// → 204 No Content
```

### 9.4 Hinweise

- **Token:** Access Token 30min, Refresh Token 7 Tage, Silent Refresh bei 401
- **Pagination:** `PaginatedMessagesResponse` mit `has_more`
- **AI Jobs:** Übersetzung & AI-Antworten async (Redis/ARQ), Polling/WebSockets für Updates
- **Archive:** Archivierte Conversations nicht in `GET /conversations/` (nur aktive), aber über `GET /conversations/{id}` abrufbar (Participants/Admin)
- **Quota:** `429 Too Many Requests` wenn Limit erreicht, siehe `/auth/users/me/quota`
