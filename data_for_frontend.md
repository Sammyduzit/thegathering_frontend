# Frontend-Anbindungsdokumentation für "The Gathering 2"

Dieses Dokument fasst alle relevanten API-Informationen zusammen, die das Frontend benötigt, um mit dem Backend von "The Gathering 2" zu interagieren. Alle Angaben beziehen sich auf den aktuellen Stand des Codes im Ordner `app/`.

## 1. API-Grundlagen

### 1.1 Basis-URL & Pfade

-   Entwicklungs-Stack (Docker): `http://localhost:8000/api/v1`
-   Produktiv-URL: Platzhalter `https://api.the-gathering2.com/api/v1` – finaler Host steht noch aus.
-   Alle Endpunkte im Code hängen unter dem Prefix `/api/v1` (siehe `main.py`).

### 1.2 Authentifizierung (Cookie-First + Header-Fallback)

Das Backend nutzt **Cookie-basierte Authentifizierung** als primäre Methode (für Next.js SSR/BFF). Header-basierte Auth ist als Fallback verfügbar (Swagger, Mobile Apps, Postman).

#### Primär: HttpOnly Cookies (Production)

Bei Login werden **3 Cookies** gesetzt:

| Cookie | Inhalt | Eigenschaften | Lebensdauer |
|--------|--------|---------------|-------------|
| `tg_access` | JWT Access Token | HttpOnly, Secure (Prod), SameSite=Lax | `settings.access_token_expire_minutes` (derzeit 30 Minuten) |
| `tg_refresh` | JWT Refresh Token | HttpOnly, Secure (Prod), SameSite=Lax | 7 Tage |
| `tg_csrf` | CSRF Token | **Nicht** HttpOnly (lesbar für JS), Secure (Prod), SameSite=Lax | 7 Tage |

**CSRF Protection (Double-Submit Cookie Pattern):**
- Alle **POST/PUT/PATCH/DELETE** Requests benötigen den Header: `X-CSRF-Token: <wert_aus_tg_csrf_cookie>`
- Frontend muss Cookie lesen und als Header senden
- GET/HEAD/OPTIONS sind exempt (safe methods)
- Ausnahmen: `/auth/login`, `/auth/register`, `/auth/refresh` (kein CSRF-Header nötig)

**Vorteile:**
- XSS-geschützt (HttpOnly Cookies)
- CSRF-geschützt (Double-Submit Pattern)
- SSR-kompatibel (automatische Cookie-Weiterleitung)

#### Fallback: Authorization Header (Dev/Swagger)

Für Entwicklungstools (Swagger, Postman) und Mobile Apps weiterhin unterstützt:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

**Hinweis:** Header-basierte Auth löst Warning-Logs aus (`header_auth_used`), ist aber voll funktionsfähig.

### 1.3 Fehlerformat

Eigene Domain-Exceptions werden durch die Exception-Handler in `main.py` in folgendes JSON-Format übersetzt:

```json
{
  "detail": "Fehlermeldung",
  "error_code": "STABLE_ERROR_CODE",
  "timestamp": "2024-05-28T12:34:56.123456+00:00"
}
```

FastAPI-Validierungsfehler behalten das gewohnte `{"detail": [...]}`-Schema.

### 1.4 CORS

`main.py` registriert `CORSMiddleware` mit folgenden Einstellungen:

-   `allow_origins`: `http://localhost:3000`, `http://127.0.0.1:3000` (Entwicklungs-Frontend)
-   `allow_credentials`: `true`
-   `allow_methods`: `*`
-   `allow_headers`: `*`

Für Produktion müssen die finalen Domains (z. B. `https://app.the-gathering2.com`) zusätzlich in die Origin-Liste aufgenommen oder über eine Env-Variable gesteuert werden.

## 2. Benutzer & Authentifizierung

### 2.1 UserResponse (Antwortmodell)

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

Zusätzliche Felder:

-   `preferred_language`: muss zu `SUPPORTED_LANGUAGES` aus `app/core/constants.py` gehören (en, de, fr, es, it, nl, pl, pt, ru, ja, zh).
-   `current_room_id`: `null`, falls Nutzer keinem Raum beigetreten ist.
-   `last_active`: wird serverseitig aktualisiert (z. B. bei Join/Leave, Messages).
-   `is_admin`: steuert Zugriff auf Admin-Only-Routen (AI/Memories).
-   `weekly_message_count`: Anzahl der gesendeten Nachrichten in der aktuellen Woche.
-   `weekly_message_limit`: Maximale Anzahl erlaubter Nachrichten pro Woche (`-1` = unbegrenzt für Admins).
-   `weekly_reset_date`: Zeitpunkt der letzten Quota-Zurücksetzung (automatisch nach 7 Tagen).

### 2.2 Endpunkte

#### POST `/auth/register`

-   **Body**: `{"email": "<valid_email>", "username": "<3-20 chars>", "password": "<8-70 chars>"}`
-   **Antwort**: `201 Created` + `UserResponse`
-   Validierungen: eindeutige E-Mail & Username, Passwort wird gehasht, Avatar wird über `generate_avatar_url` gesetzt.

#### POST `/auth/login`

**Cookie-basierte Authentifizierung mit Dual-Token System**

-   **Body**: `{"email": "...", "password": "..."}` (Login erfolgt ausschließlich per E-Mail, nicht Username)
-   **Response Headers (Cookies):**
    - `Set-Cookie: tg_access=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=1800` (30 Minuten Default)
    - `Set-Cookie: tg_refresh=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` (7 Tage)
    - `Set-Cookie: tg_csrf=<token>; Secure; SameSite=Lax; Max-Age=604800` (7 Tage, **nicht** HttpOnly)
-   **JSON Response** (für Backward-Compatibility):

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800
}
```

-   **Fehlerfälle:** `401` bei unbekannter Mail/Passwort oder inaktivem Account.
-   **Hinweis:** Frontend sollte **Cookies verwenden**, nicht den JSON-Token speichern.

#### POST `/auth/refresh`

**Silent Token-Refresh mit Rotation (OWASP 2025)**

-   **Input:** `tg_refresh` Cookie (automatisch vom Browser gesendet)
-   **Antwort:**
    - Neuer `tg_access` Cookie (aktualisiert)
    - **Neuer** `tg_refresh` Cookie (rotiert!)
    - JSON Response mit neuem Access Token
-   **Wichtig:**
    - **Token Rotation:** Bei jedem Refresh wird ein **neuer** Refresh-Token ausgestellt
    - Alter Refresh-Token wird sofort invalidiert (Single-Use Pattern)
    - CSRF-Token bleibt unverändert (Session Continuity)
-   **Security:**
    - Reuse Detection: Verwendung eines bereits rotierten Tokens revoked alle Tokens der Session (Token Family Revocation)
    - Schützt vor Token-Diebstahl durch automatische Erkennung
-   **Fehlerfälle:**
    - `401` wenn Refresh-Token ungültig/abgelaufen/widerrufen
    - `401` mit "Token reuse detected" wenn alter Token wiederverwendet wird (alle Sessions werden revoked)

#### POST `/auth/logout`

**Logout mit Token Family Revocation**

-   **Authentifizierung:** Erforderlich (`tg_access` Cookie)
-   **Aktionen:**
    1. Revoked **gesamte Token Family** in Redis (alle rotierten Tokens dieser Login-Session)
    2. Löscht alle 3 Cookies (`tg_access`, `tg_refresh`, `tg_csrf`)
-   **Antwort:** `{"message": "Logged out successfully"}`
-   **CSRF:** Benötigt `X-CSRF-Token` Header
-   **Hinweis:** Mit Token Rotation werden bei Logout alle Tokens revoked, die seit Login rotiert wurden

#### GET `/auth/me`

-   **Antwort**: aktueller Benutzer als `UserResponse`.

#### PATCH `/auth/me`

-   **Body** (alle Felder optional): `{"preferred_language": "de", "username": "newName"}`
-   `preferred_language` wird mit `validate_language_code` geprüft (Klein-/Großschreibung egal).
-   `username` muss eindeutig sein.

#### GET `/auth/users/me/quota`

**Quota-Status des aktuellen Benutzers abrufen**

-   **Authentifizierung:** Erforderlich (`tg_access` Cookie)
-   **Antwort:** `200 OK` + `UserQuotaResponse`

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

-   `weekly_limit`: `-1` = unbegrenzt (nur für Admins)
-   `remaining`: Berechneter Wert (`max(0, limit - used)`)
-   `last_reset_date`: Zeitpunkt, wann die aktuelle Woche begann (letzte Zurücksetzung)
-   `next_reset_date`: Zeitpunkt, wann die Quota zurückgesetzt wird (`last_reset_date + 7 Tage`)
-   `percentage_used`: Prozentsatz der genutzten Quota (0.0 bei unbegrenzt)

#### GET `/auth/admin/users/quota-exceeded`

**Liste aller Benutzer mit überschrittener Quota (Admin-Only)**

-   **Authentifizierung:** Admin-Rechte erforderlich
-   **CSRF:** Benötigt `X-CSRF-Token` Header
-   **Antwort:** `200 OK` + Array von `UserQuotaExceededResponse`

```json
[
  {
    "user_id": 3,
    "username": "Carol",
    "email": "carol@test.com",
    "limit": 100,
    "used": 100,
    "last_reset_date": "2024-05-28T00:00:00+00:00",
    "next_reset_date": "2024-06-04T00:00:00+00:00"
  }
]
```

-   Gibt nur aktive Benutzer zurück, die ihr Limit erreicht/überschritten haben
-   Admins mit `weekly_message_limit = -1` werden ausgeschlossen
-   Dient zur Überwachung und Benachrichtigung durch Administratoren
-   `next_reset_date`: Zeitpunkt, wann betroffene User wieder Nachrichten senden können

## 3. Räume (Rooms)

### 3.1 Datenmodelle

`RoomResponse`:

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

`RoomJoinResponse`: `{"message": "...", "room_id": 5, "room_name": "Main Hall", "user_count": 7}`

`RoomLeaveResponse`: `{"message": "...", "room_id": 5, "room_name": "Main Hall"}`

`RoomParticipantsResponse`:

```json
{
  "room_id": 5,
  "room_name": "Main Hall",
  "total_participants": 4,
  "participants": [
    {
      "id": 1,
      "username": "alice",
      "avatar_url": "https://…",
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

`RoomParticipantResponse`:

```json
{
  "id": 1,
  "username": "alice",
  "avatar_url": "https://…",
  "status": "available",
  "is_ai": false,
  "last_active": "2024-05-28T12:05:00+00:00"
}
```

**Hinweis:** `username` ist der eindeutige Identifier für Humans und AIs (z.B. "alice" oder "Bot Beta").

`UserStatusUpdate`: `{"status": "available" | "busy" | "away"}`

### 3.2 Raumverwaltung (nur Admin)

-   `POST /rooms/` – erstellt Raum (Body wie `RoomCreate` mit Feldern `name`, `description?`, `max_users?`, `is_translation_enabled`). **CSRF erforderlich.**
-   `PUT /rooms/{room_id}` – aktualisiert bestehende Räume, Duplikatnamen werden verhindert. **CSRF erforderlich.**
-   `DELETE /rooms/{room_id}` – Löscht Raum mit Cleanup: setzt Nutzer-Status auf `away`, archiviert Konversationen, **löscht Room Messages permanent**. **CSRF erforderlich.** Antwort (`RoomDeleteResponse`):

```json
{
  "message": "Room 'Main Hall' has been deleted",
  "room_id": 5,
  "users_removed": 3,
  "conversations_archived": 2,
  "messages_deleted": 47
}
```

**Wichtig:** Room Messages werden **permanent gelöscht** (hard delete). Conversation Messages (private/group chats) bleiben erhalten und sind über archivierte Conversations weiterhin zugänglich. Siehe [Delete Strategy](delete_strategy.md) für Details.

### 3.3 Raumzugriff & Präsenz (aktive Nutzer)

-   **`GET /rooms/`** – listet alle aktiven Räume (`RoomResponse[]`).
-   **`GET /rooms/{room_id}`** – einzelner Raum.
-   **`POST /rooms/{room_id}/join`** – setzt `current_room_id` und Status `available`. **CSRF erforderlich.**
-   **`POST /rooms/{room_id}/leave`** – setzt `current_room_id` auf `null`, Status `away`. **CSRF erforderlich.**
-   **`GET /rooms/{room_id}/participants`** – **Unified Participant-Liste** (Humans + AI)
    -   Response: `RoomParticipantsResponse`
    -   Enthält alle menschlichen User **und** die AI-Entity (falls im Raum)
    -   Konsistent mit `ConversationDetailResponse.participants` Struktur
    -   `is_ai` Flag unterscheidet zwischen Humans und AI
    -   `username`: Eindeutiger Identifier für Humans und AIs (z.B. "alice" oder "Bot Beta")
    -   **Use Case:** Zeige alle Participants in einer Liste, AI mit Badge/Icon markieren
-   **`PATCH /rooms/users/status`** – aktualisiert nur den eigenen Status (`available` | `busy` | `away`). **Body:** `{"status": "busy"}`. **Response:** `{"message": "...", "status": "busy"}`. **CSRF erforderlich.**
-   **`GET /rooms/count`** – CountResponse `{"count": <int>}` der aktiven Räume.
-   **`GET /rooms/health`** – einfacher Health-Check.

_Known quirks:_ Router-Responses erwarten `count` bzw. `status`. RoomService liefert aktuell `active_rooms` bzw. `new_status`, was bis zum Fix zu 500er-Errors führen kann.

### 3.4 Öffentliche Nachrichten (Room Chat)

`MessageResponse` (für Raum- und Konversationsnachrichten identisch):

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

-   `sender_id` verweist je nach Nachrichtentyp auf `users.id` oder `ai_entities.id`.
-   `message_type`: `"TEXT"` (Standard) oder `"SYSTEM"` für künftige Systemmeldungen.

-   `POST /rooms/{room_id}/messages`
    -   **Body**: `{"content": "<1-500 Zeichen>"}`.
    -   **CSRF:** Erforderlich (`X-CSRF-Token` Header)
    -   Nutzer muss im Raum sein, sonst `403` (`UserNotInRoomException`).
    -   **Response:** `201 Created` mit `MessageResponse` Payload (gleicher Aufbau wie bei Konversationsnachrichten).
    -   **Quota-Enforcement:** `429 Too Many Requests` wenn wöchentliches Nachrichtenlimit erreicht (siehe `/auth/users/me/quota`).
    -   Bei aktivierter Übersetzung werden Hintergrund-Jobs für Zielsprachen angestoßen.
    -   Bei aktivem AI im Raum wird ein ARQ-Job für Antwortprüfung eingeplant.
-   `GET /rooms/{room_id}/messages?page=<int>&page_size=<int>`
    -   **Response:** `PaginatedMessagesResponse`
    -   Nutzer muss zuvor dem Raum beigetreten sein, sonst `403` (`UserNotInRoomException`).
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
    -   **Sortierung:** `sent_at` **descending** (neueste Nachrichten zuerst)
    -   **Pagination:** page (default 1), page_size (default 50; aktuell kein serverseitiges Max-Limit)
    -   **has_more:** Boolean ob weitere Seiten verfügbar sind
    -   **total_pages:** Totale Anzahl Seiten basierend auf total/page_size (kann `0` sein, wenn keine Messages existieren)
    -   Wenn der Nutzer eine `preferred_language` gesetzt hat, wird Text serverseitig durch vorhandene Übersetzungen ersetzt.

## 4. Private & Gruppen-Konversationen

### 4.1 Datenmodelle

`ConversationCreate`:

```json
{
  "participant_usernames": ["bob", "carol", "sophia"],  // Mixed: Human und AI
  "conversation_type": "group" // oder "private"
}
```

**Wichtig:**
- `participant_usernames` kann sowohl menschliche Nutzer als auch AI-Entitäten enthalten
- Backend versucht für jeden Namen zuerst einen Human User zu finden, dann AI Entity
- Alle Participants werden **atomic beim Create** eingefügt (nicht nachträglich)
- **Creator muss bereits in einem Room sein** (`current_room_id` gesetzt), sonst Fehler.
- **Private Conversations:** `participant_usernames` muss genau **1 weiteren** Teilnehmer enthalten (Creator + 1 = 2). Zweiter Teilnehmer kann Human oder AI sein.
- **Group Conversations:** Mindestens **1 weiterer** Participant (Creator + >=1 weiterer Human oder AI).
- Alle Participants müssen im gleichen Raum sein wie der Creator; inaktive Nutzer/AIs werden abgelehnt.

**Response-Modelle:**

`ConversationListItemResponse` (für Übersichtsseiten):

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
  "latest_message_preview": "Hey everyone, check out this new feature..."
}
```

`ConversationDetailResponse` (für Detail-Seiten):

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
    },
    {
      "id": 4,
      "username": "Sophia",
      "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Sophia",
      "status": "online",
      "is_ai": true
    }
  ],
  "participant_count": 3,
  "message_count": 42,
  "latest_message": {
    "id": 123,
    "sender_id": 7,
    "sender_username": "bob",
    "content": "Hey everyone!",
    "message_type": "TEXT",
    "sent_at": "2024-05-28T14:30:00+00:00",
    "room_id": null,
    "conversation_id": 12
  },
  "permissions": {
    "can_post": true,
    "can_manage_participants": true,
    "can_leave": true
  }
}
```

`ParticipantInfo`:

```json
{
  "id": 7,
  "username": "bob",
  "avatar_url": "https://...",
  "status": "available",
  "is_ai": false
}
```

`username` ist der eindeutige Identifier (wird für API-Calls wie Remove/Add verwendet). Bei AI-Teilnehmern liefert `status` den Wert aus `AIEntityStatus` (z. B. `online`, `offline`).

`ConversationPermissions`:

```json
{
  "can_post": true,
  "can_manage_participants": true,
  "can_leave": true
}
```

`PaginatedMessagesResponse`:

```json
{
  "messages": [MessageResponse, ...],
  "total": 42,
  "page": 1,
  "page_size": 50,
  "total_pages": 1,
  "has_more": false
}
```

**Weitere Antworten:**

-   `create_conversation`: `{"message": "Group conversation created successfully", "conversation_id": 12, "participants": 3}`

### 4.2 Endpunkte

**Conversation Management:**

-   **`POST /conversations/`** – Erstellt Konversation mit Human und/oder AI Participants. **CSRF erforderlich**.
    -   Unterstützt gemischte Participant-Listen: `["alice", "sophia"]` (Human + AI)
    -   Backend erkennt automatisch ob ein Name zu einem Human User oder AI Entity gehört
    -   Alle Participants werden atomic eingefügt (keine nachträglichen `add_ai_participant` Calls mehr)
    -   Validierung: Creator muss in einem Raum sein; Private = genau 1 weiterer Participant (Human **oder** AI), Group = mindestens 1 weiterer Participant (Human **oder** AI)
    -   Response: `{"message": "Group conversation created successfully", "conversation_id": 12, "participants": 3}`

-   **`GET /conversations/`** – Liste aller aktiven Konversationen des aktuellen Users.
    -   Response: `ConversationListItemResponse[]`
    -   Enthält: room_name, participant_names, latest_message_preview, latest_message_at
    -   Optimiert für Übersichtsseiten (kompakte Daten)
    -   **Neu:** Jetzt mit latest_message_preview und room_name für lebendige Kacheln

-   **`GET /conversations/{conversation_id}`** – Detaillierte Conversation-Informationen.
    -   Response: `ConversationDetailResponse`
    -   Enthält: vollständige Participant-Details (inkl. `username` als Identifier, avatar_url, status, is_ai)
    -   Message-Metadaten: message_count, latest_message (vollständiges Message-Objekt)
    -   Permissions: can_post, can_manage_participants, can_leave
    -   Room-Metadaten: room_name
    -   **Use Case:** Conversation Detail Page – ein Request statt mehrerer
    -   **Vorteil:** Vermeidet Filtern der kompletten Liste, liefert erweiterte Metadaten
    -   **Archiviert:** Wird auch für archivierte Conversations geliefert, wenn User Participant ist oder Admin (für Memory-Links relevant)

-   **`PATCH /conversations/{conversation_id}`** – Update Conversation Metadata. **CSRF erforderlich**. **NEU!**
    -   **Body:** `ConversationUpdate`
    ```json
    {
      "is_active": false  // Archive (false) oder Unarchive (true)
    }
    ```
    -   **Berechtigung:** Nur Participants können ihre eigene Conversation archivieren
    -   **Response:**
    ```json
    {
      "message": "Conversation archived successfully",
      "conversation_id": 12,
      "is_active": false
    }
    ```
    -   **Use Case:** Archive-Feature (z.B. "Conversation verstecken" ohne zu löschen)
    -   **Fehler:** `403` wenn User kein Participant, `404` wenn Conversation nicht existiert

-   **`DELETE /conversations/{conversation_id}`** – Archive Conversation (Soft Delete). **CSRF erforderlich**. **NEU!**
    -   **Berechtigung:** Nur Participants können archivieren
    -   **Aktionen:**
        - Setzt `is_active = false` (Soft Delete)
        - Daten bleiben erhalten (Messages, Participants)
        - Archivierte Conversations erscheinen nicht mehr in `GET /conversations/` (Aktiv-List), sind aber weiter über `GET /conversations/{id}` lesbar (Participants/Admin)
        - **Triggers long-term memory creation** (background task für AI, falls vorhanden)
    -   **Response:** `204 No Content`
    -   **Fehler:** `403` wenn User kein Participant, `404` wenn Conversation nicht existiert
    -   **Hinweis:** Dies ist ein Alias für `PATCH` mit `is_active: false` - REST-konform
    -   **RAG System:** Bei Archivierung wird automatisch long-term memory erstellt (chunked + embedded) für personalisierte AI-Erinnerungen

-   **`GET /conversations/{conversation_id}/participants`** – Teilnehmerliste inkl. AI-Kennzeichnung.
    -   Response: `ParticipantInfo[]`
    -   **Hinweis:** Für Detail-View ist der neue `GET /conversations/{id}` Endpoint empfohlen (enthält Participants bereits)

**Messages:**

-   **`POST /conversations/{conversation_id}/messages`** – Sendet Nachricht. **CSRF erforderlich**.
    -   Body: `{"content": "..."}`
    -   Response: `MessageResponse`
    -   **Status Code:** `201 Created` (sofortige Rückmeldung)
    -   **Quota-Enforcement:** `429 Too Many Requests` wenn wöchentliches Nachrichtenlimit erreicht (siehe `/auth/users/me/quota`)
    -   **AI Response:** Falls AI-Participant vorhanden, wird asynchroner Background-Job getriggert
    -   **Wichtig:** Message wird SOFORT gespeichert und zurückgegeben, AI antwortet später
    -   **Logging:** Job-Enqueueing wird geloggt, Fehler werden caught (Message-Send schlägt nicht fehl)

-   **`GET /conversations/{conversation_id}/messages?page=&page_size=`** – Nachrichtenverlauf mit Pagination.
    -   **Response:** `PaginatedMessagesResponse`
    ```json
    {
      "messages": [MessageResponse, ...],
      "total": 42,
      "page": 1,
      "page_size": 50,
      "total_pages": 1,
      "has_more": false
    }
    ```
    -   **Sortierung:** `sent_at` **descending** (neueste Nachrichten zuerst)
    -   **Pagination:** page (default 1, starting at 1), page_size (default 50; aktuell kein serverseitiges Max-Limit)
    -   **has_more:** Boolean ob weitere Seiten verfügbar sind
    -   **total_pages:** Totale Anzahl Seiten basierend auf total/page_size (kann `0` sein, wenn keine Messages existieren)
    -   **Übersetzungen:** Aktuell wird immer der Originaltext zurückgegeben. Übersetzungen werden zwar erzeugt, aber beim Lesen (noch) nicht angewendet. Room Messages werden dagegen serverseitig übersetzt, wenn `preferred_language` gesetzt ist.

### 4.3 Participant-Management (Unified Human/AI)

**POST `/conversations/{conversation_id}/participants`** – Fügt Participant (Human oder AI) hinzu. **CSRF erforderlich**.

-   **Body**: `{"username": "alice"}` oder `{"username": "sophia"}` (AI-Name)
-   **Logik:**
    1. Versucht zuerst, einen Human User mit dem Username zu finden
    2. Falls nicht gefunden, sucht nach einer AI Entity mit dem Namen
    3. Fügt den gefundenen Participant zur Conversation hinzu
-   **Berechtigung:** Jeder Conversation-Participant kann andere einladen
-   **Response (ParticipantAddResponse):**

```json
{
  "message": "User 'alice' added to conversation",
  "conversation_id": 12,
  "username": "alice",
  "participant_count": 3
}
```

-   **Fehler:** `404` wenn weder User noch AI gefunden wurde

**DELETE `/conversations/{conversation_id}/participants/{username}`** – Entfernt Participant. **CSRF erforderlich**.

-   **Logik:**
    1. User können **sich selbst** aus der Conversation entfernen (self-leave)
    2. **Nur Admins** können andere User entfernen
    3. **Nur Admins** können AI Entities entfernen
    4. **Auto-Archivierung:** Wenn letzter Participant die Conversation verlässt, wird sie automatisch archiviert (`is_active = false`)
-   **Response (ParticipantRemoveResponse):**

```json
{
  "message": "User 'alice' removed from conversation",
  "conversation_id": 12,
  "username": "alice",
  "participant_count": 2
}
```

-   **Fehler:**
    -   `403` wenn Non-Admin versucht, andere zu entfernen
    -   `404` wenn Participant nicht gefunden oder nicht in Conversation
-   **Hinweis:** Doppelte Participants werden durch Unique Constraints auf DB-Ebene verhindert
-   **AI-Removal:** Wenn eine AI entfernt wird (durch Admin oder Goodbye), wird automatisch ein Long-Term-Memory-Job enqueued (falls AI-Features aktiv).

## 5. AI-Entitäten

### 5.1 Datenmodelle

`AIEntityResponse`:

```json
{
  "id": 4,
  "username": "sophia",
  "description": "Hilfreicher AI-Assistent für allgemeine Fragen",
  "system_prompt": "You are a helpful AI assistant...",
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

**Neue Felder (verfügbar seit v2.0):**

- **`description`** (optional): Textbeschreibung der AI (max 1000 Zeichen)
- **`room_response_strategy`**: Steuert wie AI in öffentlichen Räumen reagiert (siehe 5.1.1)
- **`conversation_response_strategy`**: Steuert wie AI in privaten/Gruppen-Conversations reagiert (siehe 5.1.1)
- **`response_probability`**: Float 0.0-1.0, nur relevant bei `room_probabilistic` Strategy
- **`cooldown_seconds`**: Minimale Sekunden zwischen AI-Antworten (null = kein Cooldown, 0-3600 erlaubt)
- **`avatar_url`**: Avatar-URL (DiceBear API, Style: "bottts") - wird automatisch beim Create generiert, kann optional überschrieben werden
- **`is_active`**: Boolean, false wenn AI gelöscht/archiviert wurde

**Hinweise:**
- `current_room_name` wird automatisch aus der Relationship geladen (eager loading + @property im Model)
- AI Entities haben nur noch `username` (z.B. "sophia"), keine separate `display_name` mehr

#### 5.1.1 AI Response Strategies

**Room Response Strategies** (öffentliche Räume):

| Strategy | Verhalten | Use Case |
|----------|-----------|----------|
| `room_mention_only` | Antwortet nur bei @mention oder wenn Name erwähnt wird | Standard, zurückhaltend |
| `room_probabilistic` | Antwortet mit `response_probability` Wahrscheinlichkeit (0.0-1.0), immer bei Mention | Gelegentliche Teilnahme |
| `room_active` | Antwortet auf fast jede Nachricht (außer sehr kurze wie "ok") | Sehr aktiv, Moderator |
| `no_response` | Antwortet nie (z.B. nach graceful goodbye) | Deaktiviert |

**Conversation Response Strategies** (private/group chats):

| Strategy | Verhalten | Use Case |
|----------|-----------|----------|
| `conv_every_message` | Antwortet auf jede Nachricht | Sehr aktive Assistenz |
| `conv_on_questions` | Antwortet nur auf Fragen (?, "was", "wie", "warum", etc.) | Hilfsbereiter Assistent |
| `conv_smart` | Antwortet auf Fragen ODER wenn erwähnt | Intelligente Balance |
| `no_response` | Antwortet nie | Deaktiviert |

**Rate Limiting (Cooldown):**
- `cooldown_seconds: null` → Kein Rate Limiting, AI antwortet sofort wenn Strategy erlaubt
- `cooldown_seconds: 30` → Mindestens 30 Sekunden zwischen Antworten
- Cooldown gilt **pro Kontext** (separate Timer für jeden Room/Conversation)
- Cooldown-Check läuft **vor** Strategy-Check (effizienter)

`AIAvailableResponse` (für `GET /ai/rooms/{room_id}/available`):

```json
{
  "id": 4,
  "username": "sophia",
  "model_name": "gpt-4o-mini",
  "status": "online"
}
```


`AIEntityCreate` / `AIEntityUpdate`:

**Verfügbare Felder:**
- `username`: Unique username für AI (kann Leerzeichen enthalten, max 200 Zeichen)
- `description` (optional): Textbeschreibung (max 1000 Zeichen)
- `system_prompt`: Instruktionen für die AI
- `model_name`: LLM Model (z.B. "gpt-4o-mini", "claude-3-5-sonnet")
- `temperature` (optional): 0.0-2.0 (default: 0.7)
- `max_tokens` (optional): 1-32000 (default: 1024)
- `room_response_strategy` (optional): Strategy für Rooms (siehe 5.1.1)
- `conversation_response_strategy` (optional): Strategy für Conversations (siehe 5.1.1)
- `response_probability` (optional): 0.0-1.0 (default: 0.3)
- `cooldown_seconds` (optional): 0-3600 oder null (default: null)
- `config` (optional): JSON für zusätzliche LangChain-Parameter
- `avatar_url` (optional): Custom Avatar-URL (wird automatisch generiert falls null, Style: "bottts")
- `status` (Update only): "online" | "offline"
- `current_room_id` (Update only): Room-Zuweisung

**Room-Zuweisung (Update only):**
- `null`: AI verlässt aktuellen Raum
- Zahl: AI wird einem Raum zugewiesen (nur wenn `status` == `online` und Raum noch keine AI hat)
- Feld weglassen: Raumzuweisung bleibt unverändert

**Beispiel AIEntityCreate:**
```json
{
  "username": "Assistant Alpha",
  "description": "Hilfsbereiter Assistent für technische Fragen",
  "system_prompt": "You are a helpful assistant...",
  "model_name": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 500,
  "room_response_strategy": "room_mention_only",
  "conversation_response_strategy": "conv_on_questions",
  "response_probability": 0.3,
  "cooldown_seconds": 30
}
```

### 5.2 Endpunkte (Alle Admin-only)

**Wichtig:** Alle AI-Endpunkte sind **Admin-only**. Normale User können AI-Entities nicht direkt verwalten, sondern nur über die unified Participant-Endpoints in Conversations einladen (siehe 4.3).

**GET Endpoints (Admin-only, kein CSRF):**
-   `GET /ai/entities` – alle AI-Entitäten.
-   `GET /ai/entities/available` – nur aktive, nicht gelöschte AIs.
-   `GET /ai/entities/{entity_id}` – Details.
-   `GET /ai/rooms/{room_id}/available` – liste freier AIs für einen Raum.

**State-Changing Endpoints (Admin + CSRF erforderlich):**
-   `POST /ai/entities` – legt neue AI an, Status startet als `offline`.
-   `PATCH /ai/entities/{entity_id}` – Teil-Update inkl. Raumzuweisung & Statuswechsel.
-   `DELETE /ai/entities/{entity_id}` – entfernt AI (soft delete, Status wechselt auf offline).
-   `POST /ai/entities/{entity_id}/goodbye` – initiiert Abschiedssequenz (siehe `AIEntityService.initiate_graceful_goodbye`). Response ist derzeit schlank (`AIGoodbyeResponse`): nur `message`, `ai_entity_id`, `conversation_id`, `room_id`. Goodbye-Messages werden trotzdem erzeugt, Strategien auf `no_response` gesetzt und Long-Term-Memory-Tasks enqueued, die Detail-Summary wird aber nicht zurückgegeben.

**Hinweis:** Die alten Endpoints `POST /ai/conversations/{id}/invite` und `DELETE /ai/conversations/{id}/ai/{ai_entity_id}` wurden entfernt. Verwende stattdessen die unified Participant-Endpoints unter `/conversations/{id}/participants` (siehe 4.3).

```json
{
  "message": "AI goodbye initiated",
  "ai_entity_id": 4,
  "conversation_id": null,
  "room_id": null
}
```

## 6. AI Memories & RAG System (Admin)

### 6.0 RAG System Overview

**Three-Layer Memory Architecture:**

| Layer | Purpose | user_id | embedding | Trigger |
|-------|---------|---------|-----------|---------|
| Short-term | Recent conversation context (chunked à 24 Messages) | Set | No | Nach jeder AI-Antwort (inline) + Catch-up beim LTM-Task für fehlende/partielle Chunks (<24) |
| Long-term | Persistente Fakten aus Konversationen | Set | Yes | Beim Archivieren (DELETE) oder AI-Leave → ARQ-Task mit Fakt-Extraktion |
| Personality | Global knowledge base | NULL | Yes | Admin upload |

**Retrieval:**
- Hybrid search: Vector (70%) + Keywords (30%)
- Two-level RRF fusion (within-layer + cross-layer)
- Tiered context building (guaranteed minimums per layer)

**Configuration (`.env`):**

**Embedding & Vector Search:**
- `ENABLE_VECTOR_SEARCH=true` - Enable vector retrieval
- `EMBEDDING_PROVIDER=google` - Embedding provider: "google" (Gemini) or "openai" (OpenAI)
- `EMBEDDING_MODEL=gemini-embedding-001` - Model name (or text-embedding-3-small for OpenAI)
- `EMBEDDING_DIMENSIONS=1536` - Vector dimensions (default: 1536)
- `VECTOR_SEARCH_WEIGHT=0.7` - Weight for vector search in hybrid retrieval
- `KEYWORD_SEARCH_WEIGHT=0.3` - Weight for keyword search in hybrid retrieval

**Memory Retrieval:**
- `TOTAL_MEMORY_LIMIT=10` - Max memories in context (default: 10)
- `GUARANTEED_SHORT_TERM=2` - Guaranteed minimum short-term memories
- `GUARANTEED_LONG_TERM=2` - Guaranteed minimum long-term memories
- `GUARANTEED_PERSONALITY=1` - Guaranteed minimum personality memories
- `SHORT_TERM_WEIGHT=2.0` - Recency boost for short-term
- `LONG_TERM_WEIGHT=1.0` - Weight for long-term memories
- `PERSONALITY_WEIGHT=1.0` - Weight for personality memories
- `SHORT_TERM_CANDIDATES=5` - Candidate limit for short-term (over-fetch for RRF)
- `LONG_TERM_CANDIDATES=5` - Candidate limit for long-term (over-fetch for RRF)
- `PERSONALITY_CANDIDATES=5` - Candidate limit for personality (over-fetch for RRF)

**Short-Term Memory:**
- `SHORT_TERM_TTL_DAYS=7` - TTL for short-term memories (default: 7 days)

**Long-Term Memory (LTM) Extraction:**
- `LTM_PROVIDER=google` - LTM extraction provider: "google" (Gemini) or "openai" (OpenAI)
- `LTM_EXTRACTION_MODEL=gemini-2.5-flash-lite` - Model for fact extraction (or gpt-4o-mini for OpenAI)
- `LTM_EXTRACTION_TEMPERATURE=0.3` - Temperature for LTM extraction
- `LTM_MAX_FACTS_PER_CHUNK=10` - Max facts extracted per chunk
- `LTM_MIN_IMPORTANCE_THRESHOLD=0.3` - Min importance score for facts (0.0-1.0)
- `LTM_EXTRACTION_MAX_RETRIES=3` - Number of retries before fallback
- `LTM_EXTRACTION_RETRY_DELAY=1.0` - Delay between retries (seconds)

**Keyword Extraction (YAKE):**
- `KEYWORD_LANGUAGE=de` - Keyword extraction language: "de" (German) or "en" (English)
- `KEYWORD_MAX_NGRAMS=3` - Max n-gram size for phrases (default: 3)
- `KEYWORD_WINDOW_SIZE=3` - Context window size for co-occurrence
- `KEYWORD_DEDUP_THRESHOLD=0.9` - Deduplication threshold (0.0-1.0)
- `KEYWORD_MIN_LENGTH=2` - Minimum keyword length (allows "AI", "KI")
- `KEYWORD_TOP_N=20` - Number of candidate keywords to extract

**RRF (Reciprocal Rank Fusion):**
- `RRF_CONSTANT_K=60` - Standard RRF constant for rank fusion

**Note:** Currently supports private conversations only. Group/room memory planned.

## 6. AI Memories (Admin)

### 6.1 Datenmodelle

`MemoryResponse`:

**Long-Term Memory (Fact-based):**
```json
{
  "id": 9,
  "entity_id": 4,
  "conversation_id": 12,
  "room_id": null,
  "summary": "Philosophy",
  "memory_content": {
    "fact": {
      "text": "testadmin mentioned they are interested in determinism and free will, especially Kant's perspective",
      "importance": 0.8,
      "participants": ["testadmin"],
      "theme": "Philosophy"
    },
    "conversation_id": 12,
    "chunk_index": 0,
    "message_range": "0-23",
    "message_ids": [100, 101, 102, 103]
  },
  "keywords": ["determinismus", "freier wille", "kant"],
  "importance_score": 0.8,
  "embedding": [0.123, -0.456, ...],  // 1536-dimensional vector
  "access_count": 2,
  "memory_metadata": {
    "type": "long_term",
    "from_short_term": true,
    "conversation_id": 12,
    "chunk_index": 0,
    "fact_hash": "a3b2c1d4..."
  },
  "created_at": "2024-05-28T10:00:00+00:00",
  "last_accessed": "2024-05-28T10:05:00+00:00"
}
```

**Short-Term Memory (Text-based Chunks):**
```json
{
  "id": 8,
  "entity_id": 4,
  "conversation_id": 12,
  "room_id": null,
  "summary": "testadmin: Ich denke über X nach...",
  "memory_content": {
    "messages": [
      {"message_id": 100, "sender_name": "testadmin", "content": "Ich denke über X nach"},
      {"message_id": 101, "sender_name": "Assistant Alpha", "content": "Das ist interessant..."}
    ]
  },
  "keywords": ["determinismus", "philosophie"],
  "importance_score": 1.0,
  "embedding": null,  // STM has no embedding
  "access_count": 0,
  "memory_metadata": {
    "type": "short_term",
    "chunk_index": 0,
    "message_range": "0-23"
  },
  "created_at": "2024-05-28T10:00:00+00:00",
  "last_accessed": "2024-05-28T10:05:00+00:00"
}
```

**Wichtige Felder:**
- `summary`:
  - **Automatische LTM (fact-based)**: `fact.theme` (z.B. "Philosophy", "Travel")
  - **Manuelle LTM (text-based)**: Erste 200 Zeichen des Texts
  - **STM**: Erste 200 Zeichen
- `memory_content`: Strukturiert unterschiedlich je nach Memory-Typ
  - **Automatische LTM (fact-based)**: `fact`, `conversation_id`, `chunk_index`, `message_range`, `message_ids`
  - **Manuelle LTM (text-based)**: `full_text` mit vollständigem Text
  - **STM (text-based)**: `messages` Array mit `message_id`, `sender_name`, `content`
- `importance_score`:
  - **Automatische LTM (fact-based)**: Aus LLM Fact-Extraction (0.0-1.0, gefiltert nach `LTM_MIN_IMPORTANCE_THRESHOLD`)
  - **Manuelle LTM (text-based)**: 1.0 (fest)
  - **STM**: 1.0 (fest)
- `memory_metadata.type`: `"short_term"`, `"long_term"`, oder `"personality"`
- `memory_metadata.chunk_index`: Position im Conversation-Archiv (0-basiert)
- `memory_metadata.fact_hash`: Hash zur Duplikat-Erkennung (nur bei automatischer LTM)
- `memory_metadata.created_by`: `"admin"` (manuell) oder fehlt (automatisch)
- `embedding`: 1536-dim Vektor für Semantic Search (null bei STM, present bei LTM)

**Summary: Memory-Strukturen im Überblick**

| Memory-Typ | `memory_content` Struktur | Erstellung | Embedding | `importance_score` |
|------------|---------------------------|------------|-----------|-------------------|
| **Short-Term (STM)** | `messages` Array | Nach jeder AI-Antwort (inline) | Nein (null) | 1.0 (fest) |
| **Long-Term (automatisch)** | `fact` Object (fact-based) | ARQ-Task bei Archive/AI-Leave | Ja | LLM-Extraktion (0.0-1.0) |
| **Long-Term (manuell)** | `full_text` String (text-based) | POST /memories (Admin) | Ja | 1.0 (fest) |
| **Personality** | `full_text` String | POST /memories/admin/ai-entities/{id}/personality | Ja | Konfigurierbar |

`MemoryListResponse`:

```json
{
  "memories": [MemoryResponse, ...],
  "total": 25,
  "page": 1,
  "page_size": 10,
  "total_pages": 3
}
```

### 6.2 Memory Management Endpoints (Admin-only)

**Automatic Memory Creation:**
- **Short-term:** Created after each AI response (inline, no embedding, TTL via `SHORT_TERM_TTL_DAYS`)
  - Chunked in 24er Blöcken (`memory_metadata.type=short_term`, `chunk_index`, `message_range`)
  - Incremental chunking: Nur der neueste vollständige Chunk wird erstellt (idempotent)
  - Bei jeder AI-Antwort: Wenn 24 neue Messages vorhanden → 1 neuer Chunk
  - Catch-up Mechanismus im LTM-Task füllt fehlende/partielle Chunks nach (auch bei <24 Messages)
- **Long-term:** ARQ-Task bei Conversation-Archive (`DELETE /conversations/{id}`) oder AI-Leave
  - **Automatische Participant-Erkennung:** user_ids werden automatisch aus Conversation geholt (keine manuelle Übergabe nötig)
  - **Catch-up STM Chunks:** Vor LTM-Extraktion werden fehlende STM-Chunks automatisch nachgefüllt
  - **Fact Extraction:** LLM (Google Gemini oder OpenAI, siehe `LTM_PROVIDER`/`LTM_EXTRACTION_MODEL`) extrahiert strukturierte Fakten aus jedem STM-Chunk
  - **Max Facts:** `LTM_MAX_FACTS_PER_CHUNK` Fakten pro Chunk (default: 10)
  - **Importance Filtering:** Nur Fakten mit Score ≥ `LTM_MIN_IMPORTANCE_THRESHOLD` werden gespeichert
  - **Embeddings:** Jeder Fakt wird einzeln embedded (1 Fakt = 1 LTM Entry = 1 Embedding)
  - **Retry Logic:** Bei Fehlern wird Extraktion `LTM_EXTRACTION_MAX_RETRIES` mal wiederholt (default: 3)
  - **STM Cleanup:** STM-Chunks werden nur nach erfolgreicher LTM-Erstellung gelöscht (transaktional)
- **Cleanup:** Daily cron (3 AM) entfernt STM älter als `SHORT_TERM_TTL_DAYS`.

**Manual Long-Term Memory Creation (Text-based):**

**POST `/memories`** – Create manual long-term memory (Text-based). **CSRF erforderlich**.

**Wichtig:** Manuelle Memories verwenden **Text-based Struktur** (`full_text`), während automatische LTM **Fact-based Struktur** (`fact`) verwendet.

Request:
```json
{
  "entity_id": 1,
  "conversation_id": 5,
  "user_ids": [1, 2],  // REQUIRED: From conversation.participants
  "text": "testadmin: Ich denke über X nach\n\nAssistant Alpha: Das ist interessant...",
  "keywords": ["optional", "override"]  // Optional, auto-extracted wenn null
}
```

**Wichtig:**
- `user_ids` ist **PFLICHT beim manuellen Erstellen** (Frontend sendet Participant-IDs aus `conversation.participants`)
- Bei **automatischer LTM-Erstellung** (Conversation-Archive, AI-Leave) werden `user_ids` automatisch aus der Conversation geholt
- Format: `"username: message\n\nusername: message"` (Doppelzeilenumbruch zwischen Messages)
- Backend erstellt automatisch:
  - Embedding (Google/OpenAI API, abhängig von `EMBEDDING_PROVIDER`)
  - Keywords (YAKE, Sprache aus `KEYWORD_LANGUAGE`)
  - Summary (erste 200 Zeichen)
  - chunk_index (max existing + 1)
  - `importance_score`: 1.0 (fest bei manueller Erstellung)

Response: Single `MemoryResponse` mit **Text-based Struktur**:
```json
{
  "id": 10,
  "entity_id": 1,
  "conversation_id": 5,
  "summary": "testadmin: Ich denke über X nach...",
  "memory_content": {
    "full_text": "testadmin: Ich denke über X nach\n\nAssistant Alpha: Das ist interessant..."
  },
  "keywords": ["denken", "interessant"],
  "importance_score": 1.0,
  "embedding": [0.123, ...],
  "memory_metadata": {
    "type": "long_term",
    "chunk_index": 2,
    "created_by": "admin",
    "extractor_used": "yake"
  }
}
```

**Frontend-Hinweis:** Es gibt keine serverseitige harte Begrenzung auf 500 Zeichen im Memory-Endpunkt; Textlänge orientiert sich an praktikablen Chunk-Größen. UI kann eigene Limits setzen.

**GET Endpoints (kein CSRF):**
-   `GET /memories?entity_id=1&conversation_id=5&include_short_term=false` – Filter + Pagination (Admin)
    - `entity_id`/`room_id` werden gefiltert; `conversation_id` wird aktuell nicht gefiltert (Bekannter Stand: UI ggf. filtern).
    - `include_short_term` (default: false) blendet STM standardmäßig aus.
    - Response: `MemoryListResponse`
-   `GET /memories/{memory_id}` – Einzelnes Memory (`404` wenn nicht vorhanden)
-   `GET /memories/search?entity_id=<id>&keywords=python,fastapi&limit=10` – Keyword-Suche

**State-Changing Endpoints (CSRF erforderlich):**
-   `POST /memories` – Siehe oben (Context-Aware Creation)
-   `PATCH /memories/{memory_id}` – Update Memory
    -   Body: `MemoryUpdate`
    -   Felder: `summary`, `memory_content`, `keywords`, `importance_score`
    -   Keywords werden neu extrahiert, wenn `summary` geändert wird und keine Keywords übergeben wurden.
    -   Embeddings werden bei Updates **nicht** neu gerechnet (nur bei Create).
-   `DELETE /memories/{memory_id}` – Hard Delete, `204 No Content`
    -   **Hinweis:** Chunk-Index anderer Memories bleibt unverändert (Lücken akzeptiert)
-   `POST /memories/admin/ai-entities/{entity_id}/personality` – Personality Upload
    - Body: `PersonalityUploadRequest`
    ```json
    {
      "text": "Large text content...",
      "category": "books",
      "metadata": {"book_title": "Harry Potter", "chapter": 1}
    }
    ```
    - Response: `PersonalityUploadResponse`
    ```json
    {
      "created_memories": 234,
      "memory_ids": [1, 2, 3, ...],
      "category": "books",
      "chunks": 234
    }
    ```
    - Text wird automatisch gechunked und embedded
    - Erstellt global memories (user_ids=[], conversation_id=null)

### 6.3 Frontend UI Flow (Empfohlen)

**Seite 1: `/memories` - Entity Auswahl**
```typescript
// Entity-Dropdown → Weiterleitung zu /memories/{entity_id}
```

**Seite 2: `/memories/{entity_id}` - Conversations + Personality**
```typescript
// Tab 1: Personality Memories (user_ids=[])
// Tab 2: Long-Term Conversations (grouped by conversation_id)
//   - Liste aller Conversations mit Chunk-Count
//   - Click → /memories/{entity_id}/conversation/{conversation_id}
```

**Seite 3: `/memories/{entity_id}/conversation/{conversation_id}` - Chunks + CRUD**
```typescript
// Liste aller Chunks (chronologisch, chunk_index sortiert)
// Pro Chunk: [Edit] [Delete] Buttons
// Unten: [+ Add Memory] Button

// Add Memory Modal:
const handleAddMemory = async (text: string) => {
  const conversation = await fetch(`/api/conversations/${conversationId}`);
  const userIds = conversation.participants
    .filter(p => !p.is_ai)
    .map(p => p.id);

  await fetch('/api/memories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify({
      entity_id: entityId,       // From URL
      conversation_id: conversationId,  // From URL
      user_ids: userIds,         // From conversation
      text: text,                // User input (max 500 chars)
    }),
    credentials: 'include',
  });
};

// Edit Memory Modal:
await fetch(`/api/memories/${memoryId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify({
    text: updatedText,  // Regeneriert Embedding!
    keywords: ["new", "keywords"],
  }),
  credentials: 'include',
});

// Delete Memory:
await fetch(`/api/memories/${memoryId}`, {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': getCsrfToken() },
  credentials: 'include',
});
// → 204 No Content
```

**Text Format Beispiel:**
```
testadmin: Ich denke über freien Willen nach

Assistant Alpha: Das ist eine der ältesten philosophischen Fragen

testadmin: Wie siehst du das?
```
- Doppelter Zeilenumbruch (`\n\n`) zwischen Messages
- Format: `username: nachricht`
- Max 500 Zeichen (MEMORY_CONFIG.MEMORY_TEXT_LENGTH)

## 7. Übersetzung & Spracheinstellungen

-   Räume mit `is_translation_enabled = true` lösen automatische Übersetzung aus.
-   Zielsprachen werden durch die `preferred_language` der Raum- bzw. Konversationsteilnehmer bestimmt (`TranslationService`).
-   Nutzer ohne gesetzte Sprache erhalten Originaltexte.
-   Gedrosselte Übersetzungsjobs laufen über Hintergrundtasks (`async_bg_task_manager`); Frontend muss asynchrone Aktualisierung der Nachrichten berücksichtigen (z. B. Polling oder WebSockets in zukünftiger Phase).
-   Aktueller Stand: Room Messages werden beim Lesen serverseitig übersetzt (wenn `preferred_language` gesetzt). Conversation Messages werden zwar übersetzt und gespeichert, aber beim Lesen noch als Originaltext geliefert.

## 8. Statuscodes & Fehlerszenarien

-   `400`: Validierungsfehler auf Business-Ebene (z. B. doppelte Raum-Namen, falsche XKOR-Felder).
-   `401`: Fehlendes oder ungültiges Token.
-   `403`: Aktion erfordert Admin oder Nutzer ist nicht teilnahmeberechtigt (`UserNotInRoomException`, `NotConversationParticipantException`).
-   `404`: Ressource existiert nicht (z. B. Raum, Konversation, Memory).
-   `409`: Wird intern als `400` abgebildet (z. B. Duplikate) – Frontend sollte `error_code` auswerten.
-   `422`: Pydantic-Validierungsfehler (z. B. fehlende Felder, falsches Format).
-   `500`: Fängt nicht behandelte `DomainException`-Fälle (allgemeiner Serverfehler).

## 9. Praktische Hinweise für das Frontend

### 9.1 Cookie-basierte Authentifizierung (Next.js 15)

**Setup:**
```typescript
// app/api/auth/login/route.ts (Next.js Route Handler)
export async function POST(request: Request) {
  const body = await request.json();

  // Forward to FastAPI (Cookies werden automatisch weitergeleitet)
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include', // WICHTIG: Cookies mitnehmen
  });

  // Set-Cookie Headers an Client weiterleiten
  const cookies = response.headers.getSetCookie();
  const nextResponse = NextResponse.json(await response.json());
  cookies.forEach(cookie => nextResponse.headers.append('Set-Cookie', cookie));

  return nextResponse;
}
```

**CSRF-Token lesen & senden:**
```typescript
// lib/csrf.ts
export function getCsrfToken(): string | null {
  // Cookie lesen (browser-side)
  const match = document.cookie.match(/tg_csrf=([^;]+)/);
  return match ? match[1] : null;
}

// Alle Mutations (POST/PUT/PATCH/DELETE)
fetch('/api/rooms/5/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken()!, // ← Pflicht!
  },
  body: JSON.stringify({ content: 'Hello!' }),
  credentials: 'include',
});
```

**Silent Token Refresh (mit Rotation):**
```typescript
// middleware.ts oder API wrapper
async function fetchWithAutoRefresh(url: string, options: RequestInit) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    // Access Token abgelaufen, refresh probieren
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Sendet tg_refresh Cookie
    });

    if (refreshResponse.ok) {
      // Token wurden rotiert (neue Cookies wurden automatisch gesetzt)
      // Retry original request
      response = await fetch(url, options);
    } else {
      // Refresh failed - Token kompromittiert oder abgelaufen
      // → User zu Login weiterleiten
      window.location.href = '/login';
    }
  }

  return response;
}
```

**WICHTIG bei Token Rotation:**
- Nach erfolgreichem `/auth/refresh` werden **BEIDE** Cookies aktualisiert (`tg_access` + `tg_refresh`)
- Alter Refresh-Token ist sofort ungültig (Single-Use)
- Bei erneutem Refresh-Versuch mit altem Token → `401 "Token reuse detected"` → Alle Sessions revoked
- Frontend muss nichts speziern - Browser handhabt Cookie-Updates automatisch

### 9.2 Room Messages - Best Practices

**Initial Load:**
```typescript
// Lade erste Seite
const response = await fetch('/api/rooms/5/messages?page=1&page_size=50');
const { messages, total, page, page_size, total_pages, has_more } = await response.json();
// → PaginatedMessagesResponse
```

**Infinite Scroll:**
```typescript
// Load more wenn has_more === true
if (has_more) {
  const nextPage = await fetch(`/api/rooms/5/messages?page=${page + 1}&page_size=50`);
}
```

**Hinweise:**
- Messages kommen DESC (neueste zuerst) - für Chat-View ggf. clientseitig umkehren
- `total_pages` und `has_more` helfen bei UI-Entscheidungen (Show "Load More" button)

### 9.3 Weitere Hinweise

-   **Token-Handling:** Access Token läuft nach 30min ab, Refresh Token nach 7 Tagen. Frontend sollte auf `401` mit Silent Refresh reagieren.
-   **Pagination:** Room & Conversation Messages nutzen jetzt `PaginatedMessagesResponse` mit vollständigen Metadaten.
-   **Room.has_ai:** Kennzeichnet, ob eine AI dauerhaft im Raum aktiv ist; `AIEntityService` kümmert sich darum, den Flag korrekt zu pflegen.
-   **Hintergrundjobs:** Übersetzung und AI-Antworten laufen async über Redis/ARQ – unmittelbare Antworten sind nicht garantiert. Frontend sollte bei Bedarf erneut Daten abrufen (Polling oder WebSockets in Zukunft).

### 9.4 Conversation Endpoints - Best Practices

**Für Übersichts-Seiten (Conversation List):**
```typescript
// Alle Conversations mit Preview laden
const conversations = await fetch('/api/conversations/');
// → ConversationListItemResponse[] mit latest_message_preview
```

**Für Detail-Seiten (Conversation Detail):**
```typescript
// Initial Load: Ein Request für alle Daten
const conversation = await fetch(`/api/conversations/${id}`);
// → ConversationDetailResponse mit Participants, Permissions, Message-Count

// Messages separat laden (paginated)
const response = await fetch(`/api/conversations/${id}/messages?page=1&page_size=50`);
const { messages, total, page, page_size, total_pages, has_more } = await response.json();
// → PaginatedMessagesResponse

// Load more messages if has_more === true
if (has_more) {
  const nextPage = await fetch(`/api/conversations/${id}/messages?page=${page + 1}&page_size=50`);
}
```

**Message Posting:**
```typescript
// Post message - expect 201 Created immediately
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
  const message = await response.json(); // MessageResponse
  // Add to UI immediately
  // AI response (if any) will come later via polling/WebSocket
}
```

**Archive/Unarchive Conversations:**
```typescript
// Archive conversation
const archiveResponse = await fetch(`/api/conversations/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify({ is_active: false }),
  credentials: 'include',
});
// → {"message": "Conversation archived successfully", ...}

// Unarchive conversation
await fetch(`/api/conversations/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify({ is_active: true }),
  credentials: 'include',
});

// DELETE ist Alias für Archive (REST-konform)
await fetch(`/api/conversations/${id}`, {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': getCsrfToken() },
  credentials: 'include',
});
// → 204 No Content
```

**Performance-Optimierung:**
- **Liste:** Nutze `GET /conversations/` für kompakte Übersicht (nur aktive Conversations)
- **Detail:** Nutze `GET /conversations/{id}` statt Liste + Filtern
- **Participants:** Sind bereits in Detail-Response enthalten (`username` = eindeutiger Identifier; separater `/participants` Endpoint nur bei Bedarf)
- **Messages:** Immer separat laden (pagination), nutze `has_more` für infinite scroll
- **Sortierung:** Messages kommen DESC (neueste zuerst) - für Chat-View ggf. clientseitig umkehren
- **Archive:** Archivierte Conversations (`is_active=false`) erscheinen nicht in `GET /conversations/` (Aktiv-Liste), sind aber über `GET /conversations/{id}` abrufbar (Participants/Admin) – für Archiv-View separate Logik/API-Call verwenden
