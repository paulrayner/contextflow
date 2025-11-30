# Project Management Feature - Implementation Plan

**Status: ✅ COMPLETE** (merged to main via PR #1 on 2025-11-30)

## Overview

Enable users to create, edit, delete, and organize their ContextFlow projects through a modern modal-based interface.

## Development Branch

Work on feature branch to keep main stable:

```bash
git checkout -b feature/project-management
git push -u origin feature/project-management
```

Create PR to merge into main when ready.

## Design Decisions

1. **TopBar:** Replace dropdown with clickable project name → opens ProjectListModal ✅
2. **Rename:** Explicit pencil button for rename (changed from double-click for better discoverability) ✅
3. **Delete:** Custom ProjectDeleteDialog (changed from browser confirm for better UX) ✅
4. **Samples in Welcome:** Visible but visually secondary (not collapsed) ✅

## Code Organization

```text
src/model/actions/projectActions.ts  ✅ (pure CRUD functions)
src/model/projectUtils.ts            ✅ (helpers)
src/components/ProjectListModal.tsx  ✅
src/components/ProjectCreateDialog.tsx ✅
src/components/ProjectDeleteDialog.tsx ✅ (added for better UX)
src/components/ImportConflictDialog.tsx ✅ (added for Slice 8)
```

## Implementation Slices (User-Value Flows)

### Slice 1: First-time user creates their own project ✅

**User Value:** New users can immediately start mapping their own systems

**Flow:** App loads → WelcomeModal → "Create new project" → enters name → lands on empty canvas

**Changes:**

- [x] Update WelcomeModal with "Create new project" as primary CTA (samples secondary)
- [x] Create ProjectCreateDialog (name input + Create/Cancel)
- [x] Create `generateEmptyProject(name)` pure function
- [x] Create `validateProjectName(name)` pure function
- [x] Create `createProjectAction(state, name)` in projectActions.ts
- [x] Wire `createProject` action into store
- [x] Remove "Empty Project" from built-in samples

---

### Slice 2: First-time user explores samples first ✅

**User Value:** New users can learn by exploring real examples

**Flow:** App loads → WelcomeModal → expands samples → clicks sample → lands on sample project

**Changes:**

- [x] Update WelcomeModal to show samples as secondary option (visible but not primary)
- [x] Samples load existing project (already works, just UI update)

---

### Slice 3: Returning user switches projects ✅

**User Value:** Users can easily navigate between their projects

**Flow:** On canvas → clicks project name in TopBar → ProjectListModal → clicks project → switches

**Changes:**

- [x] Create ProjectListModal with grid of project cards
- [x] Show project name, context count, last modified on each card
- [x] Add `createdAt`/`updatedAt` to Project type (optional for migration)
- [x] Create `formatRelativeTime()`, `getProjectMetadata()`, `sortProjectsByLastModified()` helpers
- [x] Add auto-timestamping to persistence layer
- [x] Click card switches project and closes modal
- [x] Replace TopBar dropdown with clickable project name that opens modal

---

### Slice 4: User creates a new project from canvas ✅

**User Value:** Users can start fresh projects without leaving the app

**Flow:** On canvas → clicks project name → ProjectListModal → "New Project" → enters name → new canvas

**Changes:**

- [x] Add "New Project" button to ProjectListModal
- [x] Reuse ProjectCreateDialog from Slice 1
- [x] Close ProjectListModal when opening create dialog

---

### Slice 5: User renames a project ✅

**User Value:** Users can fix naming mistakes

**Flow:** ProjectListModal → clicks pencil → edits inline → Enter saves

**Changes:**

- [x] Add pencil button for rename (changed from double-click for discoverability)
- [x] Create `renameProjectAction(state, projectId, newName)` pure function
- [x] Wire `renameProject` action into store
- [x] Enter saves, Escape cancels, blur saves

---

### Slice 6: User deletes a project ✅

**User Value:** Users can clean up unused projects

**Flow:** ProjectListModal → hovers card → clicks trash → confirms → project removed

**Changes:**

- [x] Add trash icon on card hover
- [x] Create `canDeleteProject()` and `selectNextProject()` helpers
- [x] Create `deleteProjectAction(state, projectId)` pure function
- [x] Wire `deleteProject` action into store (includes IndexedDB delete)
- [x] Custom ProjectDeleteDialog (changed from browser confirm for better UX)
- [x] Hide trash for built-in projects (use `isBuiltInProject()`)

---

### Slice 7: User duplicates a project ✅

**User Value:** Users can experiment safely without risking original

**Flow:** ProjectListModal → hovers card → clicks copy → duplicate created

**Changes:**

- [x] Add copy icon on card hover (next to trash)
- [x] Create `generateUniqueProjectName()` helper (" - Copy", " - Copy 2", etc.)
- [x] Create `duplicateProjectAction(state, projectId)` pure function (deep clone with new IDs)
- [x] Wire `duplicateProject` action into store

---

### Slice 8: User imports a project that already exists ✅

**User Value:** Users don't accidentally overwrite their work

**Flow:** TopBar → imports JSON → ID conflict → chooses "Replace" or "Import as New"

**Changes:**

- [x] Detect if imported project ID already exists
- [x] Show ImportConflictDialog: "Replace existing" vs "Import as new project"
- [x] "Import as New" regenerates all entity IDs
- [x] Create `regenerateAllIds(project)` helper
- [x] Create `checkImportConflict()` and `importProjectAsNew()` helpers
- [x] Create `validateImportedProject()` for malformed JSON handling

---

### Slice 9: Edge Cases & Polish ✅

**User Value:** Robust experience without surprises

**Changes:**

- [x] Empty/whitespace name → disable Create/Rename button
- [x] Only one project left → disable delete, show tooltip explaining why
- [x] Deleting active project → auto-switch to next project first
- [x] Built-in projects → hide delete button entirely
- [x] Name collisions on duplicate → auto-append " - Copy 2", etc.
- [x] Malformed JSON import → show error, don't crash
- [x] Manual smoke test all flows in browser

---

## Testing Strategy ✅

All pure functions have tests (72 tests in projectActions.test.ts):

- Slice 1: `generateEmptyProject`, `validateProjectName`, `createProjectAction` ✅
- Slice 3: `formatRelativeTime`, `getProjectMetadata`, `sortProjectsByLastModified` ✅
- Slice 5: `renameProjectAction` ✅
- Slice 6: `canDeleteProject`, `selectNextProject`, `deleteProjectAction`, `isBuiltInProject` ✅
- Slice 7: `generateUniqueProjectName`, `duplicateProjectAction` ✅
- Slice 8: `regenerateAllIds`, `checkImportConflict`, `importProjectAsNew`, `validateImportedProject` ✅

## Out of Scope

- Project templates beyond built-in samples
- Project archiving (soft delete)
- Project sharing/export links
- Tags/categories/search
- Bulk operations
