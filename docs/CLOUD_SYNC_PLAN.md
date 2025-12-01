# ContextFlow Cloud Sync Implementation Plan

## Goal

Add real-time cloud sync to ContextFlow using the proven EventStormer architecture (Yjs + Cloudflare Durable Objects), enabling:

- Same user accessing projects from multiple devices
- Real-time collaboration for workshops/teaching
- Instructor observation of student work

---

## Plan Review Summary (2024-12)

This plan was reviewed and revised to adopt a **cloud-only architecture**. Key decisions:

### Key Decision: Cloud-Only (No Local/Cloud Split)

The original plan proposed dual-mode (local + cloud projects). After review, this was **rejected** in favor of cloud-only:

| Approach | Complexity | Decision |
|----------|------------|----------|
| Dual-mode (local + cloud) | Two code paths, two undo systems, 2x tests | ❌ Rejected |
| Cloud-only | Single code path, Y.UndoManager, simpler | ✅ Adopted |

All projects sync via Yjs. IndexedDB serves as an offline cache only. Existing users get automatic migration.

### Key Decision: No Dexie Dependency

| Approach | Bundle Size | Complexity | Decision |
|----------|-------------|------------|----------|
| Dexie (proposed) | +30KB gzipped | Two databases, new schema | ❌ Rejected |
| Simple Yjs cache | +0KB | Single cache purpose | ✅ Adopted |

### Architecture Validated by EventStormer

The core stack is already proven in production by EventStormer (`~/Documents/EventStormer`):

- **y-partyserver + Cloudflare**: Working with `routePartykitRequest` ✅
- **Durable Objects persistence**: Yjs state survives restarts automatically ✅
- **Bundle size**: ~60KB gzipped (yjs + y-partyserver) ✅

### Key Simplifications from Cloud-Only

1. **Single mutation path** - All changes go through Yjs
2. **Y.UndoManager from day 1** - Delete ~400 lines of manual undo/redo code
3. **Automatic migration** - Existing IndexedDB projects migrate seamlessly
4. **Simplified UI** - No local/cloud choice, just projects with share buttons

---

## Proven Architecture (EventStormer Reference)

**The core architecture is already validated** by EventStormer (`~/Documents/EventStormer`), which uses the same stack in production:

| Concern | EventStormer Proof | Status |
|---------|-------------------|--------|
| y-partyserver + Cloudflare | Working in production with `routePartykitRequest` | ✅ Proven |
| Durable Objects persistence | Yjs state survives worker restarts automatically | ✅ Proven |
| WebSocket connection | YProvider connects reliably to Cloudflare Workers | ✅ Proven |
| Bundle size | yjs (~50KB) + y-partyserver (~10KB) = ~60KB gzipped | ✅ Acceptable |

### Key Patterns from EventStormer to Reuse

**Minimal server (workers/server.ts):**

```typescript
import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";

export class YjsRoom extends YServer {
  // YServer handles all Yjs sync automatically
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ||
           new Response("Not Found", { status: 404 });
  }
};
```

**Client connection:**

```typescript
import YProvider from "y-partyserver/provider";

const provider = new YProvider(host, projectId, ydoc, {
  connect: true,
  party: "yjs-room",
});
```

### Remaining Validation (During Implementation)

These items should be tested during Step 3, not as blockers:

| Item | Validation | When |
|------|------------|------|
| Yjs CRDT text merge | Test concurrent edits on `context.name` field | Step 3 |
| Large project performance | Test with 100+ contexts | Step 4 |
| ContextFlow-specific serialization | Verify `Project` ↔ Yjs round-trip | Step 3 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ContextFlow Client                       │
├─────────────────────────────────────────────────────────────┤
│  Zustand Store ← (read-only projection)                     │
│       ↑                                                      │
│  Yjs Observer ←── Yjs Y.Doc (CRDT) ←── User Actions         │
│       ↓                    ↓                                │
│  React Components    y-partyserver/provider                 │
│       ↓                    ↓                                │
│  IndexedDB           WebSocket to Cloudflare                │
│  (existing persistence.ts + Yjs cache)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Worker                               │
├─────────────────────────────────────────────────────────────┤
│  YjsRoom (Durable Object)                                   │
│  - Yjs document persistence (D1 SQLite)                     │
│  - Real-time WebSocket sync                                 │
│  - CRDT conflict resolution                                 │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural principle:** Yjs is the single source of truth. Zustand is a read-only projection updated via Yjs observers. This prevents race conditions and ensures consistent behavior for local and remote changes.

---

## Why Cloud-Only Architecture

This plan adopts a **cloud-only** approach where all projects sync via Yjs. This simplifies the architecture significantly:

| Aspect | Dual-Mode (Rejected) | Cloud-Only (Adopted) |
|--------|---------------------|----------------------|
| Mutation code paths | Two (local + cloud) | One |
| Undo/redo systems | Two (Zustand + Yjs) | One (Y.UndoManager) |
| Test scenarios | 2x (every feature tested twice) | 1x |
| Persistence layer | Dual-purpose IndexedDB | Simple Yjs cache |
| Migration code | Convert local↔cloud | One-time auto-migration |

**Offline support is unchanged:** Yjs + IndexedDB caching provides the same offline resilience. Users can edit offline and changes sync when reconnected.

**Privacy approach:** Following industry standard (Miro, Figma, Notion) - data storage covered by Terms of Service and privacy policy, no special consent dialog.

---

## Phase 1: Cloud Sync Without Auth

### 1.1 Cloudflare Worker Setup

**New files to create:**
- `workers/server.ts` - Cloudflare Worker entry point
- `wrangler.toml` - Cloudflare configuration

**Based on EventStormer pattern:**
```typescript
// workers/server.ts
import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";

export class YjsRoom extends YServer {
  // YServer handles Yjs sync automatically
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", timestamp: new Date().toISOString() });
    }
    return (await routePartykitRequest(request, env)) || new Response("Not Found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
```

**wrangler.toml:**
```toml
name = "contextflow-collab"
main = "workers/server.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat_v2"]

[[durable_objects.bindings]]
name = "YjsRoom"
class_name = "YjsRoom"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["YjsRoom"]
```

### 1.2 New Dependencies

```bash
npm install yjs y-partyserver
npm install -D wrangler
```

**Note:** We intentionally do NOT add Dexie. The existing `persistence.ts` is minimal (~90 lines), working, and sufficient. Adding Dexie would:

- Increase bundle size by ~30KB gzipped (vs ~1KB current)
- Create two separate IndexedDB databases to maintain
- Add complexity without clear benefit for cloud sync

### 1.3 Persistence Layer (Yjs Offline Cache)

IndexedDB serves as an offline cache for Yjs state. The existing `persistence.ts` is simplified:

```typescript
// Simplified schema - just caching Yjs state
interface YjsCacheRecord {
  projectId: string;
  yjsState: Uint8Array;      // Yjs document state
  lastSyncedAt: string;       // When last synced to cloud
}

// Cache Yjs state for offline resilience
async function cacheYjsState(projectId: string, ydoc: Y.Doc): Promise<void> {
  const state = Y.encodeStateAsUpdate(ydoc);
  await db.put('yjs-cache', { projectId, yjsState: state, lastSyncedAt: new Date().toISOString() });
}

// Restore from cache when reconnecting
async function loadCachedYjsState(projectId: string): Promise<Uint8Array | null> {
  const record = await db.get('yjs-cache', projectId);
  return record?.yjsState ?? null;
}
```

**Benefits:**

- Yjs is the single source of truth
- IndexedDB is purely an offline cache
- No dual-purpose schema complexity

### 1.4 Collaboration Store

**New file:** `src/model/useCollabStore.ts`

This is the major refactor. Key responsibilities:
- Manage Yjs Y.Doc for active project
- Connect to Cloudflare via y-partyserver/provider
- Sync Yjs state ↔ Zustand state
- Handle online/offline transitions
- Autosave to IndexedDB (5-second interval like EventStormer)

**Key patterns from EventStormer to replicate:**
1. `connectToProject(projectId)` - establish WebSocket connection
2. `disconnect()` - clean up connection
3. Yjs observation → Zustand state updates
4. All mutations go through Yjs (which then syncs)

### 1.5 Data Model Mapping to Yjs

**Project structure in Yjs:**
```typescript
const yproject = ydoc.getMap("project");
yproject.set("id", string);
yproject.set("name", string);
yproject.set("contexts", Y.Array<BoundedContext>);
yproject.set("relationships", Y.Array<Relationship>);
yproject.set("groups", Y.Array<Group>);
yproject.set("repos", Y.Array<Repository>);
yproject.set("teams", Y.Array<Team>);
yproject.set("users", Y.Array<User>);
yproject.set("userNeeds", Y.Array<UserNeed>);
yproject.set("viewConfig", Y.Map);
yproject.set("temporal", Y.Map);
// ... etc
```

### 1.8 UI Changes

**New components needed:**

- `CloudStatusIndicator` - shows connection status (connected/disconnected/syncing)
- `CollaboratorsPresence` - shows who else is viewing (cursors optional for v1)
- `ShareProjectDialog` - copy shareable URL

**Modifications to existing:**

- `ProjectSwitcher` - simplified project list with share buttons
- `App.tsx` - initialize collaboration on project load

### 1.9 URL Scheme for Shareable Projects

**Format:** `contextflow.app/p/{projectId}`

**Example:** `contextflow.app/p/k7m2n9p4`

**Design decisions:**
- 8-character nanoid (62^8 = 218 trillion combinations)
- No project name in URL (privacy - doesn't reveal content)
- No auth required to access (anyone with URL can view/edit in Phase 1)
- Matches EventStormer pattern (proven, simple)

---

### 1.10 Environment Configuration

**New env vars:**

```bash
VITE_COLLAB_HOST=contextflow-collab.youraccount.workers.dev  # production
VITE_COLLAB_HOST=localhost:8787  # development
```

### 1.9 Automatic Migration for Existing Users

Users with projects in current IndexedDB get seamless migration:

1. On first app load after update, detect existing IndexedDB projects
2. For each project: create cloud room, upload data, cache locally
3. Show brief toast: "Your projects have been synced to the cloud"
4. Delete old IndexedDB entries after successful migration
5. If offline during migration: defer until next online session

**Key behaviors:**
- Migration is automatic and silent (no user action required)
- Existing project URLs work (redirected to cloud version)
- Built-in demo projects migrate like any other project

---

## Critical Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/model/store.ts` | Major refactor | Route all mutations through Yjs |
| `src/model/persistence.ts` | Simplify | Replace with Yjs offline cache |
| `src/model/undoRedo.ts` | Delete | Replace with Y.UndoManager |
| `src/model/actions/*.ts` | Refactor | Mutations go through Yjs directly |
| `src/App.tsx` | Modify | Initialize collaboration on mount, handle URL routing |
| `src/components/ProjectSwitcher.tsx` | Modify | Single list of projects with share buttons |
| `package.json` | Add deps | yjs, y-partyserver, wrangler |

**New files:**

- `workers/server.ts` - Cloudflare Worker with YjsRoom Durable Object
- `wrangler.toml` - Cloudflare configuration
- `src/model/useCollabStore.ts` - Yjs collaboration state management
- `src/components/CloudStatusIndicator.tsx` - Connection status display
- `src/components/ShareProjectDialog.tsx` - URL sharing

---

## Implementation Order (Incremental, Safety-First)

### Guiding Principles

- **Single source of truth** - Yjs owns all project data, Zustand is read-only projection
- **Test on branch** - all work on feature branch, extensive testing before merge
- **Protect import/export** - these must continue working throughout
- **Automatic migration** - existing users get seamless transition

---

### Step 1: Infrastructure Setup (No User-Facing Changes)
1. Create `workers/server.ts` and `wrangler.toml`
2. Deploy to Cloudflare staging endpoint
3. Test with simple connection from browser console
4. **Checkpoint:** WebSocket connects, basic Yjs sync works

**Risk:** None - no changes to existing code

---

### Step 2: Persistence Layer (Yjs Cache)

1. Replace persistence.ts with simple Yjs cache functions
2. Add `cacheYjsState()` and `loadCachedYjsState()` helper functions
3. Write tests for cache layer

**Checkpoint:** Yjs cache works, can store and retrieve document state

---

### Step 3: Collaboration Store

1. Create `useCollabStore.ts` for Yjs state management
2. Implement `connectToProject()` / `disconnect()`
3. Create conversion functions:
   - `projectToYjs(project: Project)` - serialize to Yjs
   - `yjsToProject(ydoc: Y.Doc)` - deserialize from Yjs
4. Set up Y.UndoManager for undo/redo
5. Write comprehensive tests for serialization round-trip
6. Test real-time sync between two browser windows

**Checkpoint:** Can create project, sync works, undo/redo works

---

### Step 4: Incremental Entity Migration (One at a Time)

**4a: Contexts + Relationships (Core)**
- These are the minimum for a useful sync
- Write tests for:
  - Add/update/delete context syncs
  - Add/update/delete relationship syncs
  - Two browsers see same changes
  - Offline edit → reconnect → sync
  - Undo/redo works across all operations

**4b: Groups**
- Add group sync to Yjs
- Test group operations sync correctly

**4c: Flow View entities (users, userNeeds, connections)**
- Add to Yjs schema
- Test Flow View operations

**4d: Metadata (teams, repos, people)**
- Add to Yjs schema
- Test metadata operations

**4e: ViewConfig + Temporal**
- Add flowStages to Yjs
- Add temporal keyframes to Yjs

**After each sub-step:**
- [ ] All existing tests pass
- [ ] New sync tests pass
- [ ] Import/export still works
- [ ] Undo/redo works
- [ ] Manual smoke test in browser

---

### Step 5: Import/Export Compatibility

**Critical safety tests:**
1. Export project → valid JSON matching existing format
2. Import JSON → creates cloud project, syncs immediately
3. Export project from old app version → import in new version works
4. Round-trip: export → import → export → compare (should be identical)

**Implementation:**
- Import/export operates on `Project` type (unchanged)
- Imported projects become cloud projects automatically

---

### Step 6: UI Integration

1. Add `CloudStatusIndicator` to header
2. Add "Share" button for projects
3. Simplify ProjectSwitcher (single list, no local/cloud distinction)
4. Add automatic migration on first load (Step 7)

---

### Step 7: Automatic Migration

1. On first load, detect existing IndexedDB projects
2. For each project: create cloud room, upload, cache locally
3. Show toast: "Your projects have been synced to the cloud"
4. Clean up old IndexedDB entries

**Data safety:**
- Migration deferred if offline
- Progress indicator during migration
- Error handling with retry option

---

### Step 8: Testing Checklist Before Merge

**Automated tests:**

- [ ] All existing unit tests pass
- [ ] New Yjs serialization tests pass
- [ ] New sync tests pass
- [ ] Import/export round-trip tests pass
- [ ] Undo/redo tests pass

**Manual testing:**

- [ ] Create project → edit → syncs to another browser
- [ ] Offline edit → reconnect → changes appear
- [ ] Export project → valid JSON
- [ ] Import JSON → creates synced project
- [ ] Existing projects auto-migrate on first load
- [ ] Large project (20+ contexts) → performance OK

**Regression testing:**

- [ ] Undo/redo works (Y.UndoManager)
- [ ] All views render correctly (Flow, Strategic, Distillation)
- [ ] Inspector panel works for all entity types
- [ ] Drag and drop works
- [ ] Built-in demo projects migrate and load correctly

---

### Step 9: Staged Rollout

**Phase A: Internal testing**

- Deploy to staging environment
- Test with your own workshops
- Fix any issues found

**Phase B: Beta release**

- Merge to main
- Announce to existing users: "Your projects now sync across devices"
- Gather feedback

**Phase C: General availability**

- Monitor for issues
- Address any migration edge cases

---

## Future: Adding Auth (Phase 2)

When ready to add authentication and payment gating:

1. **Choose auth provider** (Clerk recommended for built-in UI)
2. **Add user metadata store** (Cloudflare D1 or KV)
3. **Modify worker** to validate auth tokens
4. **Add project ownership** tracking
5. **Implement tier limits** (free: 2-3 cloud projects, pro: unlimited)
6. **Integrate Polar.sh** for payments

The Yjs sync layer remains unchanged - auth is an orthogonal concern.

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration breaks existing projects | HIGH | Test migration thoroughly, keep IndexedDB backup until confirmed |
| Yjs serialization data loss | HIGH | Comprehensive round-trip tests, validate before every deploy |
| Zustand ↔ Yjs race conditions | HIGH | Single source of truth (Yjs), clear mutation flow documented |
| Network required for first load | MEDIUM | Clear messaging, offline cache for subsequent loads |
| Offline conflict produces garbled text | MEDIUM | Show merge notification, add conflict UI in Phase 2 if needed |
| URL-based sharing security | MEDIUM | Privacy warning in UI, longer nanoid if needed, auth in Phase 2 |
| Large project performance | MEDIUM | Yjs handles large docs well, test early with 100+ contexts |
| y-partyserver package stability | MEDIUM | Lock version, monitor for updates, have fallback plan |
| Cloudflare outage | MEDIUM | Offline cache allows continued editing, show "service unavailable" |
| Cloudflare costs | LOW | Durable Objects free tier generous, monitor usage, set alerts |
| Bundle size increase | LOW | Target < 100KB gzipped, code-split if needed |

---

## Hidden Assumptions to Verify

Before implementation, verify these assumptions hold:

### Technical Assumptions

| Assumption | Verification Method | Status |
|------------|---------------------|--------|
| y-partyserver is stable and maintained | Check npm downloads, GitHub activity, open issues | ☐ Pending |
| Yjs handles 100+ entity documents performantly | Load test with sample large project | ☐ Pending |
| Cloudflare Durable Objects persist Yjs state correctly | Deploy test worker, verify state survives restarts | ☐ Pending |
| Yjs CRDT merge produces acceptable results for text fields | Test concurrent text edits, verify no corruption | ☐ Pending |
| WebSocket reconnection is handled by y-partyserver | Test network dropout/reconnect scenarios | ☐ Pending |
| IndexedDB quota (50MB+) is sufficient for local cache | Measure typical project size, estimate max projects | ☐ Pending |

### UX Assumptions

| Assumption | Verification Method | Status |
|------------|---------------------|--------|
| Automatic migration is seamless for existing users | Test with real user data, monitor support requests | ☐ Pending |
| 8-char URL is memorable enough for sharing | Compare with competitors (Figma, Miro) | ☐ Pending |
| Sync latency < 500ms is acceptable | User testing, compare to Google Docs | ☐ Pending |
| "Anyone with link can edit" is acceptable for Phase 1 | Document clearly, gather user feedback | ☐ Pending |

### Dependency Verification

Run before starting implementation:

```bash
# Check y-partyserver health
npm view y-partyserver time  # Last publish date
npm view y-partyserver repository  # GitHub link
# Check GitHub: stars, issues, last commit

# Check bundle size impact
npm pack yjs y-partyserver --dry-run  # Estimated sizes
```

---

## Pre-Implementation Decisions

All architectural decisions have been finalized:

### 1. Zustand ↔ Yjs Sync Flow

**Decision:** Option B - React → Yjs directly → Yjs observer → Zustand update → React re-render

All project data mutations go through Yjs, with observers updating Zustand. This ensures a single source of truth (Yjs), no race conditions, and consistent behavior for local and remote changes. Matches EventStormer pattern.

### 2. Undo/Redo Strategy

**Decision:** Use Y.UndoManager from day 1

**Implementation:**

- Replace existing Zustand undoStack with Y.UndoManager
- Scoped to user's own changes (like Miro/Figma)
- Ctrl+Z only undoes YOUR changes, not collaborator's
- Session-scoped (cleared on refresh)

**Benefits of cloud-only approach:**

- Single undo system (no conflict between Zustand and Yjs)
- Consistent behavior everywhere
- Delete ~400 lines of manual undo/redo code

### 3. Offline Conflict Handling

**Decision:** Option B - Merge with notification

Yjs merges automatically via CRDT. Show toast: "Your offline changes were merged with recent edits". True conflict resolution UI can be added in Phase 2 if users report issues.

### 4. Reference Cascade on Delete

**Decision:** Option A - Cascade delete

When a context is deleted, automatically delete all referencing relationships. Must be atomic in a single Yjs transaction. Matches user expectation and avoids orphaned data.

### 5. Transaction Batching

**Decision:** Option A - Single transaction

Use `ydoc.transact()` for all multi-field mutations (e.g., dragging a context updates position, classification, group membership). Ensures atomicity and reduces network chatter.

---

## Detailed Yjs Schema Specification

The high-level schema in section 1.7 needs expansion for implementation:

### Nested Structure Handling

**Problem:** `BoundedContext.positions` is 4 levels deep:
```typescript
positions: {
  flow: { x: number; y: number };
  strategic: { x: number; y: number };
  shared: { y: number };
}
```

**Solution:** Flatten to Y.Map with dot-notation keys:
```typescript
// In Yjs
const ycontext = new Y.Map();
ycontext.set('id', 'ctx-123');
ycontext.set('name', 'Payment Service');
ycontext.set('positions.flow.x', 100);
ycontext.set('positions.flow.y', 200);
ycontext.set('positions.strategic.x', 150);
ycontext.set('positions.strategic.y', 200);
ycontext.set('positions.shared.y', 200);
// ... other fields
```

**Serialization functions:**
```typescript
function contextToYMap(context: BoundedContext): Y.Map<unknown> {
  const ymap = new Y.Map();
  ymap.set('id', context.id);
  ymap.set('name', context.name);
  ymap.set('positions.flow.x', context.positions.flow.x);
  ymap.set('positions.flow.y', context.positions.flow.y);
  // ... flatten all nested fields
  return ymap;
}

function yMapToContext(ymap: Y.Map<unknown>): BoundedContext {
  return {
    id: ymap.get('id') as string,
    name: ymap.get('name') as string,
    positions: {
      flow: {
        x: ymap.get('positions.flow.x') as number,
        y: ymap.get('positions.flow.y') as number,
      },
      // ... reconstruct nested structure
    },
  };
}
```

### Array Entity Types

For entities stored in Y.Array (contexts, relationships, groups, etc.):

```typescript
// Project root structure
const yproject = ydoc.getMap('project');
yproject.set('id', projectId);
yproject.set('name', projectName);

// Arrays of entities (each element is a Y.Map)
const ycontexts = new Y.Array<Y.Map<unknown>>();
yproject.set('contexts', ycontexts);

// To add a context:
ydoc.transact(() => {
  const ycontext = contextToYMap(newContext);
  ycontexts.push([ycontext]);
});

// To update a context:
ydoc.transact(() => {
  const index = findContextIndex(ycontexts, contextId);
  const ycontext = ycontexts.get(index) as Y.Map<unknown>;
  ycontext.set('name', newName);
});

// To delete a context (with cascade):
ydoc.transact(() => {
  const index = findContextIndex(ycontexts, contextId);
  ycontexts.delete(index, 1);
  // Also delete referencing relationships
  deleteRelationshipsForContext(yproject, contextId);
});
```

### Temporal Keyframes

Complex nested structure requiring special handling:

```typescript
// temporal.keyframes[i].positions is { [contextId]: { x, y } }
// Serialize as:
yproject.set('temporal.keyframes', Y.Array<Y.Map>);

// Each keyframe is a Y.Map:
const ykeyframe = new Y.Map();
ykeyframe.set('id', keyframe.id);
ykeyframe.set('label', keyframe.label);
ykeyframe.set('timestamp', keyframe.timestamp);

// Positions stored as nested Y.Map:
const ypositions = new Y.Map();
for (const [ctxId, pos] of Object.entries(keyframe.positions)) {
  const ypos = new Y.Map();
  ypos.set('x', pos.x);
  ypos.set('y', pos.y);
  ypositions.set(ctxId, ypos);
}
ykeyframe.set('positions', ypositions);
```

---

## UI Component Specifications

### CloudStatusIndicator

**States:**

| State | Icon | Color | Label | Behavior |
|-------|------|-------|-------|----------|
| Connected | ☁️✓ | Green | "Synced" | Auto-hide after 3s |
| Syncing | ☁️↻ | Blue | "Syncing..." | Show spinner |
| Offline | ☁️✗ | Yellow | "Offline" | Persist until reconnected |
| Error | ☁️⚠ | Red | "Sync error" | Show retry button |
| Reconnecting | ☁️↻ | Yellow | "Reconnecting..." | Show attempt count |

**Location:** Header bar, right side, next to project name

**Dimensions:** ~120px width, 32px height, fits within existing header

**Interaction:** Click to show connection details dropdown (optional for Phase 1)

### ShareProjectDialog

**Trigger:** "Share" button in toolbar

**Dialog Contents:**

1. URL display (monospace, full-width, selectable): `contextflow.app/p/k7m2n9p4`
2. One-click "Copy to Clipboard" button with "Copied!" feedback (2s duration)
3. Privacy warning box (yellow background): "Anyone with this link can view AND edit this project"
4. Optional: QR code for classroom sharing
5. "Manage access" link (Phase 2: shows active sessions, revoke option)

### Offline Indicator

**When offline:**

- Banner at top: "You're offline. Changes are saved locally and will sync when reconnected."
- Pending changes count: "3 changes pending"
- Visual treatment: Yellow/amber theme
- Position: Fixed banner below header, full width
- Dismiss: Cannot dismiss while offline (auto-hides on reconnect)

**On reconnect:**

- Banner changes to: "Reconnected. Syncing X changes..." (green)
- After sync complete: "All changes synced" (auto-hide after 3s)
- If merge occurred: Toast notification: "Your changes were merged with recent edits"

### ProjectSwitcher (Simplified)

**Layout:**

```text
┌─────────────────────────────────────────────────────────┐
│  [Search projects...]                            🔍     │
├─────────────────────────────────────────────────────────┤
│  MY PROJECTS                                 [+ New]    │
│  ├── Team Workshop Map            [🔗] [•••]            │
│  │   Last synced: Just now  •  2 collaborators         │
│  ├── DDD Training Exercise        [🔗] [•••]            │
│  │   Last synced: 5 min ago                            │
│  └── My Architecture Draft        [🔗] [•••]            │
│       Last synced: 2 hours ago                          │
└─────────────────────────────────────────────────────────┘
```

**Features:**

- Search by project name (filter as you type)
- [•••] menu: Rename, Export, Delete
- [🔗] quick-share button (copies URL with toast feedback)
- Show "Last synced" and collaborator count
- Empty state: "No projects yet. Create your first project!"

**Scale handling:**

- Virtualized list for 50+ projects
- "Show more" pagination if > 20 projects
- Sort by: Recent (default), Name A-Z, Name Z-A

### New Project Flow (Simplified)

**When user clicks "+ New Project":**

```text
┌─────────────────────────────────────────────────────────┐
│                   Create New Project                     │
├─────────────────────────────────────────────────────────┤
│  Project Name: [________________________]               │
│                                                          │
│  Your project syncs automatically across devices        │
│  and can be shared with collaborators.                  │
│                                                          │
│                    [Create Project]                      │
└─────────────────────────────────────────────────────────┘
```

### Pre-Share Confirmation Dialog

**Before showing share URL, require explicit confirmation:**

```text
┌─────────────────────────────────────────────────────────┐
│                    Share Project?                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠️  ANYONE with this link can:                         │
│                                                          │
│      ✓ View all contents                                │
│      ✓ Edit contexts and relationships                  │
│      ✓ Delete items                                     │
│                                                          │
│  You cannot revoke access once shared.                  │
│  (Access control coming in a future update)             │
│                                                          │
│         [Cancel]              [Share Anyway]            │
└─────────────────────────────────────────────────────────┘
```

**After confirmation:** Show ShareProjectDialog with URL

### Project URL Routing

**When user navigates to `contextflow.app/p/abc123`:**

1. Show loading spinner with "Loading project..."
2. Attempt WebSocket connection to Cloudflare
3. On success: Load project, hide spinner, show canvas
4. On failure: Show error with options:

```text
┌─────────────────────────────────────────────────────────┐
│              Couldn't Load Project                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ❌ Unable to connect to project                        │
│                                                          │
│  Possible reasons:                                       │
│  • The project URL may be invalid                       │
│  • The project may have been deleted                    │
│  • Your internet connection may be down                 │
│                                                          │
│           [Retry]              [Create New]              │
└─────────────────────────────────────────────────────────┘
```

---

## User Journeys

### Journey 1: First-Time User Creates Project

1. User lands on app (no existing projects)
2. Clicks "+ New Project"
3. Enters project name
4. Project created, connected, empty canvas shown
5. CloudStatusIndicator shows "Connected" briefly
6. User edits, sees "Syncing..." → "Synced" feedback

### Journey 2: Existing User After Migration

1. User opens app after update (has existing IndexedDB projects)
2. Migration runs automatically in background
3. Brief toast: "Your projects have been synced to the cloud"
4. All projects now show in unified list with share buttons
5. User continues working as normal

### Journey 3: Joining Shared Project via URL

1. User receives URL from colleague: `contextflow.app/p/abc123`
2. Clicks link, app loads
3. Loading spinner: "Connecting to project..."
4. Project loads, user sees current state
5. If others are editing: presence indicators visible
6. User edits, changes sync in real-time

### Journey 4: Working Offline, Then Reconnecting

1. User is editing project
2. Internet drops, CloudStatusIndicator → "Offline"
3. Offline banner appears with pending count
4. User continues editing (changes cached locally)
5. Internet returns, banner → "Reconnecting..."
6. Sync happens automatically
7. If no conflicts: "All changes synced" (auto-hide)
8. If merge occurred: Toast "Your changes were merged with recent edits"

---

## Test Scenarios (Expanded)

### Critical Integration Tests

**Concurrent Editing:**

```gherkin
Scenario: Two users edit same bounded context simultaneously
Given: Browser A and Browser B have project "P1" open
When: Browser A changes context name to "AuthService-v2" at T=0
And: Browser B changes context name to "AuthService-Enterprise" at T=50ms
Then: Within 2 seconds, both browsers show identical name
And: The name is one of the two values (not a merge/corruption)
And: No console errors in either browser
```

**Network Partition:**

```gherkin
Scenario: Browser reconnects after offline period with divergent changes
Given: Browser A is online with project "P1"
And: Browser B disconnects from network
When: Browser A adds context "Payment Service"
And: Browser B (offline) adds context "Billing Service"
And: Browser B reconnects after 30 seconds
Then: Both browsers show both contexts within 5 seconds
And: No duplicate contexts
And: Both contexts have valid IDs and positions
```

**Large Project Performance:**

```gherkin
Scenario: Sync performance with large project
Given: Project with 100 contexts, 80 relationships, 10 groups
When: User edits a context name
Then: Change visible in second browser within 500ms
And: UI remains responsive (no frame drops > 100ms)
And: Memory usage does not exceed baseline + 50MB
```

**Reference Integrity:**

```gherkin
Scenario: Delete context with dependent relationships
Given: Context "Auth" has 3 incoming relationships
When: User deletes context "Auth"
Then: Context is removed from all browsers
And: All 3 relationships are also removed
And: No orphaned relationship references remain
And: Undo restores both context and relationships
```

### Additional Test Scenarios (From Review)

**Concurrent Text Field Editing:**

```gherkin
Scenario: Two users edit same text field simultaneously
Given: Browser A and Browser B have context "Auth" selected
When: Browser A types "Service" in the name field
And: Browser B types "Module" in the name field at same time
Then: Final value is deterministic (same in both browsers)
And: Result is NOT garbled (e.g., not "SeMrodvuilcee")
Note: Document expected Yjs CRDT behavior before implementation
```

**Extended Offline Period:**

```gherkin
Scenario: User offline for extended period with many changes
Given: Browser A is online, Browser B goes offline
When: Browser A makes 20 edits over 1 hour
And: Browser B makes 10 edits while offline
And: Browser B reconnects after 1 hour
Then: All 30 changes merge correctly
And: No data loss on either side
And: Sync completes within 10 seconds
```

**Serialization Round-Trip:**

```gherkin
Scenario: All project fields survive Yjs serialization
Given: Project with all field types populated:
  - 50 contexts with all optional fields
  - 40 relationships
  - 5 groups
  - temporal keyframes with positions
  - viewConfig with all settings
When: Project is serialized to Yjs and back
Then: Exported JSON is byte-identical to original
And: All optional/nullable fields preserved
```

**Browser Crash Recovery:**

```gherkin
Scenario: Browser crashes with pending offline changes
Given: User is editing project offline
And: Has 5 pending changes in IndexedDB cache
When: Browser crashes unexpectedly
And: User reopens app
Then: Offline cache is loaded from IndexedDB
And: Changes sync on reconnection
And: No data loss
```

**Import/Export Atomicity:**

```gherkin
Scenario: Import fails mid-stream
Given: User imports large JSON file (100 contexts)
When: Network error occurs at 50% import
Then: Import is rolled back completely
And: No partial project created
And: User sees clear error message
And: Can retry import
```

**Multi-Tab Sync:**

```gherkin
Scenario: Same project open in multiple tabs
Given: User has project open in Tab A and Tab B
When: User edits context name in Tab A
Then: Change appears in Tab B within 500ms
And: No WebSocket connection conflicts
And: Both tabs show consistent state
```

**Concurrent Delete Operations:**

```gherkin
Scenario: Two users delete same context simultaneously
Given: Browser A and Browser B see context "Payment"
When: Browser A deletes "Payment" at T=0
And: Browser B deletes "Payment" at T=50ms
Then: Context deleted (no duplicate delete errors)
And: Relationships cascade deleted once
And: Final state consistent in both browsers
```

### Regression Test Matrix

| Feature | Must Work | Notes |
|---------|-----------|-------|
| Create context | ✓ | Syncs immediately |
| Drag context | ✓ | Position sync across browsers |
| Edit in inspector | ✓ | Field-level sync |
| Undo/redo | ✓ | Y.UndoManager (user's own changes) |
| Import JSON | ✓ | Creates synced project |
| Export JSON | ✓ | Same format as before |
| View switching | ✓ | Position independence preserved |
| Groups | ✓ | Visual overlay sync |
| Temporal | ✓ | Keyframe sync |
| External contexts | ✓ | Badge + restrictions |
| Multi-browser sync | ✓ | Real-time updates |
| Offline editing | ✓ | Cached locally, syncs on reconnect |

---

## Monitoring & Observability

### Metrics to Track

**Sync Health:**
- WebSocket connection success rate
- Sync latency (p50, p95, p99)
- Reconnection frequency per session
- Failed sync attempts

**Usage:**

- Projects created per day
- Concurrent collaborators per project (histogram)
- Offline edit frequency
- Migration success rate (existing users)

**Errors:**
- Serialization failures (Yjs ↔ Project)
- WebSocket disconnections (expected vs unexpected)
- Yjs document corruption (should be 0)
- IndexedDB quota exceeded

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Sync latency p95 | > 1s | > 3s |
| WebSocket error rate | > 1% | > 5% |
| Serialization failures | > 0 | > 0 |
| Reconnection rate | > 10/hour | > 30/hour |

### Logging Points

Add structured logging to:
- `connectToProject()`: connection attempt, success/failure, latency
- `disconnect()`: reason (user-initiated, error, timeout)
- `onYjsChange()`: sync event, document size, change size
- `projectToYjs()` / `yjsToProject()`: serialization timing, entity counts
- Conflict detection: which entities, resolution applied

---

## Emergency Procedures

### If Cloud Sync Causes Data Loss

1. **Immediate:** Deploy read-only mode (disable mutations)
2. **Recovery:** Export affected projects via direct Yjs access
3. **Communication:** Notify users via in-app banner
4. **Investigation:** Check Yjs document state, IndexedDB cache

### If Yjs Document Corrupted

1. **Detection:** Serialization fails, document won't load
2. **Isolation:** Mark project as "needs recovery" in Durable Object
3. **Recovery options:**
   - Restore from user's local IndexedDB cache
   - Restore from user's last JSON export
   - Manual Yjs document repair (last resort)
4. **Prevention:** Add document validation on every load

### Cloudflare Outage Procedure

1. Users see "Service unavailable" message
2. Offline cache allows continued editing (read from IndexedDB)
3. Changes queue locally, sync when service restored
4. Monitor Cloudflare status page for updates

---

## Definition of Done (Phase 1)

### Functional Requirements

- [ ] All projects sync across devices via Yjs
- [ ] User can open same project URL on different computer, see same data
- [ ] Real-time updates visible when two people edit same project
- [ ] Connection status indicator in UI (connected/syncing/offline/error states)
- [ ] Share button copies project URL
- [ ] Undo/redo works via Y.UndoManager (user's own changes)
- [ ] Offline edits sync when reconnected

### Performance SLAs

- [ ] Edit-to-visible in second browser: < 500ms (p95)
- [ ] Large project (100 contexts) initial load: < 3s
- [ ] No memory leaks over 30-minute editing session
- [ ] Bundle size increase: < 100KB gzipped

### Concurrent Editing

- [ ] Two browsers rename same context simultaneously → one wins, both see identical result within 2s
- [ ] Concurrent add/delete of same entity → consistent state (no orphans, no duplicates)
- [ ] Reference integrity maintained (deleting context removes related relationships)

### Offline Resilience

- [ ] 10+ offline edits sync correctly on reconnect
- [ ] Offline for 1 hour with cloud changes → merges without data loss
- [ ] User sees clear "Offline - changes pending" indicator
- [ ] Offline edits preserved if browser refreshed while offline (via IndexedDB cache)

### Migration

- [ ] Existing IndexedDB projects auto-migrate on first load
- [ ] Migration shows progress indicator
- [ ] Migration deferred if offline (retries when online)
- [ ] Import/export JSON format unchanged
- [ ] Old exported JSON files import correctly

### Security (Phase 1)

- [ ] URL randomness: 8-char nanoid provides adequate entropy
- [ ] Privacy warning shown when sharing URL ("Anyone with this link can view and edit")
- [ ] Project deletion requires explicit confirmation
