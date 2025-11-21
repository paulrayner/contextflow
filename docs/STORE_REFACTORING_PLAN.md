# Store Refactoring Plan

## Current State

`src/model/store.ts` has grown to 2000+ lines with multiple responsibilities:
1. **Classification logic** (lines 14-44): Pure functions for distillation/strategic classification
2. **Autosave utility** (lines 47-51): Side effect wrapper
3. **Fit view callback** (lines 54-58): Global state management
4. **Type definitions** (lines 60-202): EditorCommand and EditorState interfaces
5. **Built-in projects** (lines 218-272): Project initialization and migration
6. **Zustand store** (lines 274+): Store creation with 40+ action methods

This violates single responsibility principle and makes the file difficult to maintain and test.

## Objective

Break down store.ts into focused, testable modules following the **extract-and-prove pattern** from refactoring guidelines:
- **ZERO behavioral changes** - extracted functions must be EXACT copies
- **Test new code, not existing code** - write tests only for extracted modules
- **Extract-and-prove pattern** - prove with tests BEFORE replacing usage

## Refactoring Slices

### Slice 1: Extract Classification Logic

**Target:** `src/model/classification.ts`

**Functions to extract:**
- `classifyFromDistillationPosition` (lines 14-28)
- `classifyFromStrategicPosition` (lines 31-44)

**Rationale:** Pure functions with zero dependencies and well-defined behavior - easiest to test

**Process:**

**Step 1: Extract**
- Copy functions to new `src/model/classification.ts` (exact duplicates)
- Add only import statements for types and export keywords
- DO NOT modify logic, variable names, or formatting

**Step 2: Test**
- Write comprehensive tests for both functions
- Test edge cases at boundaries: 25, 33, 50, 67, 75
- Test values between boundaries
- Test extreme values (0, 100)
- Achieve 100% coverage

**Step 3: Verify**
- ✅ Run tests - all must pass
- ✅ Run TypeScript compilation - no errors
- ✅ Verify extracted functions match originals EXACTLY (side-by-side comparison)

**Step 4: Replace**
- Add import statement to store.ts: `import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'`
- Remove old function definitions (lines 14-44)
- Keep all call sites unchanged
- Run TypeScript compilation again
- Manual smoke test in browser

---

### Slice 2: Extract Type Definitions

**Target:** `src/model/storeTypes.ts`

**Types to extract:**
- `ViewMode` (line 11)
- `EditorCommand` (lines 60-100)
- `EditorState` (lines 102-202)

**Rationale:** No logic, just types - safe to extract, reduces file size by ~150 lines

**Process:**

**Step 1: Extract**
- Copy type definitions to new `src/model/storeTypes.ts` (exact duplicates)
- Add necessary type imports from `./types`
- Export all types

**Step 2: Test**
- No tests needed (types only)
- Skip to Step 3

**Step 3: Verify**
- ✅ Run TypeScript compilation - no errors
- ✅ Verify types are EXACT copies

**Step 4: Replace**
- Add import statement to store.ts: `import type { ViewMode, EditorCommand, EditorState } from './storeTypes'`
- Remove old type definitions (lines 11, 60-202)
- Update any other files that import these types from store.ts
- Run TypeScript compilation again

---

### Slice 3: Extract Built-in Project Initialization

**Target:** `src/model/builtInProjects.ts`

**Code to extract:**
- Import statements for project JSONs (lines 3-6)
- `BUILT_IN_PROJECTS` array (lines 218-223)
- Migration logic (lines 229-255)
- IndexedDB save calls (lines 258-262)
- Initial project selection logic (lines 265-266)
- `initialProjects` mapping (lines 269-272)

**Rationale:** Self-contained initialization logic that runs once at module load - can be isolated

**Process:**

**Step 1: Extract**
- Copy all initialization code to new `src/model/builtInProjects.ts` (exact duplicate)
- Export `initialProjects` and `initialActiveProjectId`
- Add imports for types and persistence utilities
- Preserve exact logic flow

**Step 2: Test**
- Test that migration adds missing fields correctly
- Test that classification logic runs during migration
- Test that project IDs are preserved
- Test initial active project selection
- Achieve 100% coverage on migration logic

**Step 3: Verify**
- ✅ Run tests - all must pass
- ✅ Run TypeScript compilation - no errors
- ✅ Verify logic is EXACT copy (side-by-side comparison)

**Step 4: Replace**
- Add import to store.ts: `import { initialProjects, initialActiveProjectId } from './builtInProjects'`
- Remove initialization code (lines 3-6, 218-272)
- Use imported values in store initialization
- Run TypeScript compilation again
- Manual smoke test: verify projects load correctly

---

### Slice 4: Extract Undo/Redo Logic

**Target:** `src/model/undoRedo.ts`

**Functions to extract:**
- The `undo` action implementation (lines 1906+)
- The `redo` action implementation
- Command application logic for each EditorCommand type

**Rationale:** Complex, testable logic separate from state management - should be pure functions

**Process:**

**Step 1: Extract**
- Copy undo/redo logic to new `src/model/undoRedo.ts`
- Create pure functions: `applyUndo(project: Project, command: EditorCommand): Project`
- Create pure functions: `applyRedo(project: Project, command: EditorCommand): Project`
- Preserve exact logic for each command type

**Step 2: Test**
- Write comprehensive tests for each EditorCommand type
- Test undo for: add/delete context, move context, add/delete relationship, assign/unassign repo, create/delete group, add/remove group member
- Test redo for all the same operations
- Test edge cases: empty history, invalid commands, missing entities
- Achieve 100% coverage

**Step 3: Verify**
- ✅ Run tests - all must pass
- ✅ Run TypeScript compilation - no errors
- ✅ Verify logic is EXACT copy (side-by-side comparison)

**Step 4: Replace**
- Add import to store.ts: `import { applyUndo, applyRedo } from './undoRedo'`
- Replace undo/redo action bodies with calls to pure functions
- Remove old implementation code
- Keep state management (history arrays, pointer updates) in store
- Run TypeScript compilation again
- Manual smoke test: verify undo/redo still works

---

### Slice 5: Group Related Actions into Modules

**Target:** Multiple files by domain

Create domain-specific action modules:
- `src/model/actions/contextActions.ts` - context CRUD, positioning
- `src/model/actions/groupActions.ts` - group CRUD, membership
- `src/model/actions/relationshipActions.ts` - relationship CRUD
- `src/model/actions/actorActions.ts` - actor/need CRUD, connections
- `src/model/actions/temporalActions.ts` - keyframe operations
- `src/model/actions/viewActions.ts` - view mode, filters, UI preferences

**Rationale:** Each module has single responsibility, easier to maintain and test

**Process (per module):**

**Step 1: Extract**
- Copy related action implementations to new file (exact duplicates)
- Export as named functions accepting `(state: EditorState, ...args) => Partial<EditorState>`
- Preserve exact logic

**Step 2: Test**
- Write tests for each action function
- Focus on state transformations
- Test edge cases (missing entities, invalid IDs, boundary conditions)
- Achieve 100% coverage

**Step 3: Verify**
- ✅ Run tests - all must pass
- ✅ Run TypeScript compilation - no errors
- ✅ Verify logic is EXACT copy (side-by-side comparison)

**Step 4: Replace**
- Import action functions in store.ts
- Replace action bodies with calls to imported functions
- Remove old implementation code
- Run TypeScript compilation again
- Manual smoke test for affected features

**Module breakdown:**

**contextActions.ts:**
- `addContext`
- `deleteContext`
- `updateContext`
- `moveContext`
- `toggleExternalContext`

**groupActions.ts:**
- `addGroup`
- `deleteGroup`
- `updateGroup`
- `addContextToGroup`
- `removeContextFromGroup`

**relationshipActions.ts:**
- `addRelationship`
- `deleteRelationship`
- `updateRelationship`

**actorActions.ts:**
- `addActor`
- `deleteActor`
- `updateActor`
- `addNeed`
- `deleteNeed`
- `updateNeed`
- `connectActorToContext`
- `disconnectActorFromContext`

**temporalActions.ts:**
- `addKeyframe`
- `deleteKeyframe`
- `setCurrentKeyframe`

**viewActions.ts:**
- `setViewMode`
- `setShowExternalContexts`
- `setShowGroups`
- `setSelectedContext`
- `setSelectedGroup`
- `setTheme`

---

## Final Structure

```
src/model/
├── types.ts (existing - no changes)
├── storeTypes.ts (NEW - Slice 2)
│   └── EditorCommand, EditorState, ViewMode
├── classification.ts (NEW - Slice 1)
│   └── classifyFromDistillationPosition, classifyFromStrategicPosition
├── builtInProjects.ts (NEW - Slice 3)
│   └── initialProjects, initialActiveProjectId
├── undoRedo.ts (NEW - Slice 4)
│   └── applyUndo, applyRedo
├── actions/
│   ├── contextActions.ts (NEW - Slice 5)
│   ├── groupActions.ts (NEW - Slice 5)
│   ├── relationshipActions.ts (NEW - Slice 5)
│   ├── actorActions.ts (NEW - Slice 5)
│   ├── temporalActions.ts (NEW - Slice 5)
│   └── viewActions.ts (NEW - Slice 5)
├── persistence.ts (existing - no changes)
└── store.ts (REDUCED from 2000+ to ~200 lines)
    └── Zustand store creation + action wiring
```

**Final store.ts responsibilities:**
- Import action functions
- Import initial data from builtInProjects
- Import types from storeTypes
- Create Zustand store with `create<EditorState>()`
- Wire Zustand actions to imported pure functions
- Maintain autosave calls
- Manage history state (past/future arrays, pointer)

---

## Execution Order

**Recommended order: 1 → 2 → 3 → 4 → 5**

**Rationale:**
1. **Slice 1** (Classification) - Lowest risk, pure functions, builds confidence in process
2. **Slice 2** (Types) - No tests needed, quick win, reduces file size
3. **Slice 3** (Built-in projects) - Moderate complexity, self-contained
4. **Slice 4** (Undo/Redo) - Benefits from reduced file size, complex but isolated
5. **Slice 5** (Action modules) - Largest refactor, best done last when confident

Each slice is independently valuable and can be stopped at any point without breaking functionality.

---

## Safety Checklist (Before Each Step 4)

Before modifying store.ts:
- [ ] New module tests passing (100%)
- [ ] TypeScript compiles without errors
- [ ] Extracted code is EXACT copy (verified side-by-side)
- [ ] Ready for Step 4 replacement

---

## Success Criteria

After completing all slices:
- [ ] store.ts reduced from 2000+ to ~200 lines
- [ ] All business logic covered by unit tests
- [ ] TypeScript compiles with no errors
- [ ] All features work identically (zero behavioral changes)
- [ ] Each module has single responsibility
- [ ] Pure functions separated from side effects
- [ ] Complexity reduced (easier to maintain and extend)
