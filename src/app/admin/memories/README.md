# Memory Management UI

## Overview

The Memory Management UI provides a comprehensive interface for managing AI entity memories across The Gathering platform. It implements a 3-level hierarchical navigation system for organizing personality knowledge and conversation-based long-term memories.

## Architecture

### 3-Level Navigation

```
Level 1: Entity Selection     (/admin/memories)
    ↓
Level 2: Memory Categories    (/admin/memories/[entityId])
    ↓
Level 3: CRUD Operations      (/admin/memories/[entityId]/conversation/[conversationId])
```

### File Structure

```
src/app/admin/memories/
├── page.tsx                          # Level 1: Entity list (server component)
├── [entityId]/
│   ├── page.tsx                      # Level 2: Server component (data fetching)
│   ├── EntityDetailClient.tsx        # Level 2: Client component (tabs)
│   └── conversation/
│       └── [conversationId]/
│           ├── page.tsx              # Level 3: Server component
│           ├── ConversationMemoriesClient.tsx  # Level 3: CRUD UI
│           └── useMemoryModal.ts     # Custom hook for modal state
└── README.md                         # This file
```

## Features

### Level 1: Entity Selection
- **Direct Entity List**: Click any AI entity card to manage its memories
- **Entity Information**: Shows model, status, current room
- **About Section**: Explains personality vs long-term memories

### Level 2: Memory Categories

#### Tab 1: Personality Memories
- **Global Knowledge Base**: Books, documentation, onboarding materials
- **Upload Interface**: Paste large text, auto-chunks to 500-char segments
- **Category Tags**: Organize by source type (books, docs, etc.)
- **Metadata Support**: Optional JSON metadata per upload
- **No User Context**: Available across all conversations

#### Tab 2: Long-Term Conversations
- **Archived Conversations**: Auto-created when conversations are deleted
- **Conversation Groups**: Grouped by conversation ID
- **Memory Counts**: Shows total chunks per conversation
- **Latest Activity**: Displays last interaction date

### Level 3: CRUD Operations
- **Add Memory**: Create new memory chunks for specific conversations
- **Edit Memory**: Update text and keywords
- **Delete Memory**: Remove memory chunks with confirmation
- **User Context**: Auto-binds to non-AI participants
- **Format Guidelines**: Double newlines for message separation
- **Character Limit**: 500 characters per chunk (enforced)

## Data Flow

### Personality Upload Flow
```typescript
1. User pastes large text (any length)
2. Frontend sends to POST /api/ai/entities/{id}/upload_personality
3. Backend auto-chunks to 500-char segments
4. Each chunk gets:
   - Embedding (vector)
   - Keywords (auto-extracted)
   - Category tag
   - Metadata (optional)
5. Frontend refreshes to show new memories
```

### Conversation Memory Flow
```typescript
1. User creates/edits memory for specific conversation
2. Frontend validates:
   - Text length ≤ 500 characters
   - Required fields present
3. POST /api/memories with:
   - entity_id
   - conversation_id
   - user_ids (auto-extracted from participants)
   - text
   - keywords (optional)
4. Backend generates embedding + summary
5. Frontend refreshes conversation view
```

## Memory Retrieval

Memories are retrieved using **hybrid search**:
- **70% Vector Similarity**: Semantic matching via embeddings
- **30% Keyword Matching**: Exact term matching

## Components

### Server Components
- `page.tsx` files: Handle authentication, data fetching, error states
- Benefits: Fast initial load, SEO-friendly, no client JS for static parts

### Client Components
- `EntityDetailClient.tsx`: Tab switching, personality upload, loading states
- `ConversationMemoriesClient.tsx`: Full CRUD, modal management, form validation
- Benefits: Interactive UI, optimistic updates, real-time feedback

### Custom Hooks
- `useMemoryModal.ts`: Encapsulates modal state management
  - Reduces component complexity by ~80 LOC
  - Reusable pattern for future modal UIs

### Shared Components
- `LoadingSkeleton`: Flexible skeleton loader
  - `variant="list"`: Simple list items (default)
  - `variant="memory"`: Detailed memory cards
  - `variant="inline"`: Inline spinner

## API Integration

### Endpoints Used
```typescript
// List memories (with filters)
GET /api/memories?entity_id={id}&conversation_id={id}&include_short_term=false

// Create memory
POST /api/memories
Body: { entity_id, conversation_id, user_ids, text, keywords? }

// Update memory
PATCH /api/memories/{id}
Body: { text?, keywords? }

// Delete memory
DELETE /api/memories/{id}

// Upload personality
POST /api/ai/entities/{id}/upload_personality
Body: { text, category?, metadata? }
```

### Error Handling
- Type-safe error parsing via `getErrorMessage()`
- User-friendly error messages in `AlertStrip` components
- Network retry logic: 4 retries with exponential backoff

## Constants

```typescript
MEMORY_CONFIG = {
  MESSAGE_LENGTH: 500,
  MEMORY_TEXT_LENGTH: 500,
  CHUNK_SIZE: 500,
}
```

## Loading States

All mutations trigger loading skeletons during `router.refresh()`:
- Personality upload → List skeleton (3 items)
- Memory create/update/delete → List skeleton (3 items)
- Prevents "flash of empty content"

## Best Practices

### When to Use Personality Memories
- Books, manuals, documentation
- Onboarding materials
- Company policies
- General knowledge bases
- **NOT** user-specific information

### When to Use Conversation Memories
- User preferences from past chats
- Project-specific context
- Relationship history
- Inside jokes, shared references

### Memory Formatting
```
// ✅ Good: Double newlines between messages
alice: Hey, how's the project?

bob: Going well! Just finished the API.

alice: Awesome, let me know when it's deployed.

// ❌ Bad: Single newlines or no separation
alice: Hey, how's the project?
bob: Going well! Just finished the API.
alice: Awesome, let me know when it's deployed.
```

## Performance Optimizations

1. **Server Components**: Data fetching on server (faster initial load)
2. **Lazy Loading**: Skeletons prevent layout shift
3. **Optimistic UI**: `router.refresh()` for instant feedback
4. **Memoization**: `useMemo` for expensive computations (grouping, sorting)
5. **Conditional Rendering**: Only render active tab content

## Future Enhancements

- [ ] Bulk delete for conversation memories
- [ ] Search/filter within entity memories
- [ ] Export memories as JSON/CSV
- [ ] Memory analytics (access count, importance trends)
- [ ] Bulk upload personalities from file (PDF, TXT, MD)
- [ ] Memory importance editing (currently auto-scored)

## Code Simplifications (Phase 2c)

This implementation benefited from several code quality improvements:

### 1. Unified Loading Component
**Before**: 3 separate skeleton components (`MemoryLoadingSkeleton`, `ListItemSkeleton`, `InlineSpinner`)
**After**: Single `LoadingSkeleton` with variants
**Saved**: ~20 LOC

### 2. Removed Entity Selection Page
**Before**: Dropdown-based selection on separate page
**After**: Direct entity cards with click-to-navigate
**Saved**: ~87 LOC (entire `EntitySelectionClient.tsx`)
**UX Win**: Fewer clicks, faster navigation

### 3. Custom Hook Extraction
**Before**: 80+ LOC of modal state in `ConversationMemoriesClient`
**After**: Encapsulated in `useMemoryModal` hook
**Saved**: ~50 LOC in component
**Win**: Better separation of concerns, testable hook

### Total LOC Reduction
- Removed legacy `MemoryManagementClient.tsx`: **-652 LOC**
- Removed `EntitySelectionClient.tsx`: **-87 LOC**
- Simplified skeletons: **-20 LOC**
- Extracted hook: **-50 LOC** (in component)
- **Net reduction: ~800+ LOC**

## Testing

Manual testing checklist:

- [ ] Navigate from entity list → entity detail
- [ ] Switch between Personality ↔ Conversations tabs
- [ ] Upload personality text (small and large)
- [ ] Verify auto-chunking (check memory count)
- [ ] Navigate to conversation detail
- [ ] Create new conversation memory
- [ ] Edit existing memory
- [ ] Delete memory (confirm dialog)
- [ ] Verify loading skeletons appear during mutations
- [ ] Test error states (invalid JSON metadata, empty text, etc.)

## Related Documentation

- [Backend API Spec](/docs/data_for_frontend.md)
- [Refactoring Overview](/REFACTORING_OVERVIEW.md)
- [Type Definitions](/src/types/README.md)
