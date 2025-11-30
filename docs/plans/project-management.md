# Project Management Feature - Implementation Plan

## Overview

Enable users to create, edit, delete, and organize their ContextFlow projects through a modern modal-based interface.

## Design Decisions

1. **TopBar:** Replace dropdown with clickable project name → opens ProjectListModal
2. **Rename:** Double-click project name to inline edit
3. **Delete:** Browser `confirm()` dialog
4. **Samples in Welcome:** Visible but visually secondary (not collapsed)

## Code Organization

```text
src/model/actions/projectActions.ts  (NEW - pure CRUD functions)
src/model/projectUtils.ts            (NEW - helpers)
src/components/ProjectListModal.tsx  (NEW)
src/components/ProjectCreateDialog.tsx (NEW)
```

## Implementation Slices (User-Value Flows)

### Slice 1: First-time user creates their own project

**User Value:** New users can immediately start mapping their own systems

**Flow:** App loads → WelcomeModal → "Create new project" → enters name → lands on empty canvas

**Changes:**

- Update WelcomeModal with "Create new project" as primary CTA (samples secondary)
- Create ProjectCreateDialog (name input + Create/Cancel)
- Create `generateEmptyProject(name)` pure function
- Create `validateProjectName(name)` pure function
- Create `createProjectAction(state, name)` in projectActions.ts
- Wire `createProject` action into store
- Remove "Empty Project" from built-in samples

---

### Slice 2: First-time user explores samples first

**User Value:** New users can learn by exploring real examples

**Flow:** App loads → WelcomeModal → expands samples → clicks sample → lands on sample project

**Changes:**

- Update WelcomeModal to show samples as secondary option (visible but not primary)
- Samples load existing project (already works, just UI update)

---

### Slice 3: Returning user switches projects

**User Value:** Users can easily navigate between their projects

**Flow:** On canvas → clicks project name in TopBar → ProjectListModal → clicks project → switches

**Changes:**

- Create ProjectListModal with grid of project cards
- Show project name, context count, last modified on each card
- Add `createdAt`/`updatedAt` to Project type (optional for migration)
- Create `formatRelativeTime()`, `getProjectMetadata()`, `sortProjectsByLastModified()` helpers
- Add auto-timestamping to persistence layer
- Click card switches project and closes modal
- Replace TopBar dropdown with clickable project name that opens modal

---

### Slice 4: User creates a new project from canvas

**User Value:** Users can start fresh projects without leaving the app

**Flow:** On canvas → clicks project name → ProjectListModal → "New Project" → enters name → new canvas

**Changes:**

- Add "New Project" button to ProjectListModal
- Reuse ProjectCreateDialog from Slice 1
- Close ProjectListModal when opening create dialog

---

### Slice 5: User renames a project

**User Value:** Users can fix naming mistakes

**Flow:** ProjectListModal → double-clicks name → edits inline → Enter saves

**Changes:**

- Add inline editing to project name in ProjectListModal
- Create `renameProjectAction(state, projectId, newName)` pure function
- Wire `renameProject` action into store
- Enter saves, Escape cancels, blur saves

---

### Slice 6: User deletes a project

**User Value:** Users can clean up unused projects

**Flow:** ProjectListModal → hovers card → clicks trash → confirms → project removed

**Changes:**

- Add trash icon on card hover
- Create `canDeleteProject()` and `selectNextProject()` helpers
- Create `deleteProjectAction(state, projectId)` pure function
- Wire `deleteProject` action into store (includes IndexedDB delete)
- Browser `confirm()` dialog
- Hide trash for built-in projects (use `isBuiltInProject()`)

---

### Slice 7: User duplicates a project

**User Value:** Users can experiment safely without risking original

**Flow:** ProjectListModal → hovers card → clicks copy → duplicate created

**Changes:**

- Add copy icon on card hover (next to trash)
- Create `generateUniqueProjectName()` helper (" - Copy", " - Copy 2", etc.)
- Create `duplicateProjectAction(state, projectId)` pure function (deep clone with new IDs)
- Wire `duplicateProject` action into store

---

### Slice 8: User imports a project that already exists

**User Value:** Users don't accidentally overwrite their work

**Flow:** TopBar → imports JSON → ID conflict → chooses "Replace" or "Import as New"

**Changes:**

- Detect if imported project ID already exists
- Show choice dialog: "Replace existing" vs "Import as new project"
- "Import as New" regenerates all entity IDs
- Create `regenerateAllIds(project)` helper

---

### Slice 9: Edge Cases & Polish

**User Value:** Robust experience without surprises

**Changes:**

- Empty/whitespace name → disable Create/Rename button
- Only one project left → disable delete, show tooltip explaining why
- Deleting active project → auto-switch to next project first
- Built-in projects → hide delete button entirely
- Name collisions on duplicate → auto-append " - Copy 2", etc.
- Malformed JSON import → show error, don't crash
- Manual smoke test all flows in browser

---

## Testing Strategy

Each slice includes tests for its pure functions:

- Slice 1: `generateEmptyProject`, `validateProjectName`, `createProjectAction`
- Slice 3: `formatRelativeTime`, `getProjectMetadata`, `sortProjectsByLastModified`
- Slice 5: `renameProjectAction`
- Slice 6: `canDeleteProject`, `selectNextProject`, `deleteProjectAction`, `isBuiltInProject`
- Slice 7: `generateUniqueProjectName`, `duplicateProjectAction`
- Slice 8: `regenerateAllIds`

## Out of Scope

- Project templates beyond built-in samples
- Project archiving (soft delete)
- Project sharing/export links
- Tags/categories/search
- Bulk operations
