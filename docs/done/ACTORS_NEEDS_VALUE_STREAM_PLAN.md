# Add Actors & User Needs to Value Stream View

## Overview
Enable actors and user needs to display in Value Stream view, sharing the exact same positions (both x and y) as Strategic view. Moving them in one view will reflect in the other view.

## Key Changes Required

### 1. Data Model Updates (`src/model/types.ts`)
- Change `Actor.position` from `number` to `positions: { flow: { x: number }, strategic: { x: number }, shared: { y: number } }`
- Change `UserNeed.position` from `number` to same dual positioning structure
- This matches the existing `BoundedContext` pattern

### 2. Canvas Rendering (`src/components/CanvasArea.tsx`)
- Remove `viewMode === 'strategic'` condition from actor/need node creation (lines ~1817, 1845)
- Update actor node positioning to use: `x = (actor.positions.flow.x / 100) * 2000` for flow view, `positions.strategic.x` for strategic
- Update actor node positioning to use: `y = (actor.positions.shared.y / 100) * 1000`
- Same for user need nodes
- Update drag handlers to save to correct position coordinate based on `viewMode`
- Update edge rendering conditions (actor-need connections, need-context connections) to remove view restrictions

### 3. Store Actions (`src/model/actions/actorActions.ts`)
- Update `addActorAction` to initialize with dual positions (default: x=50, y=10 for actors, y=20 for needs)
- Update `updateActorPositionAction` to handle both x and y, saving to correct coordinates based on view
- Same updates for `addUserNeedAction` and `updateUserNeedPositionAction`

### 4. Migration for Existing Data
- Update `examples/sample.project.json` and other example projects to convert `actor.position` → `actor.positions`
- Add default `shared.y` values (actors: 10, needs: 20) and mirror `position` → both flow/strategic x

### 5. Toolbar Updates (`src/components/CanvasArea.tsx`)
- Verify "Add Actor" / "Add User Need" buttons work in Value Stream view (may already exist but be hidden)
- Update toolbar to show actor/need creation buttons in both views

### 6. Inspector Panel
- Verify position editing works correctly for actors/needs in both views
- Should update `positions.flow` when in flow view, `positions.strategic` in strategic view

### 7. Vertical Spacing Documentation
- Add constants for recommended Y positions (e.g., `ACTOR_DEFAULT_Y = 10`, `NEED_DEFAULT_Y = 20`, `MIN_CONTEXT_Y = 40`)
- Document that users should maintain spacing between needs and contexts manually

## Files to Modify
- `src/model/types.ts` - Type definitions
- `src/model/actions/actorActions.ts` - Store actions
- `src/components/CanvasArea.tsx` - Rendering & drag handling
- `src/components/InspectorPanel.tsx` - Position editing UI (verify)
- `examples/*.json` - All sample projects (data migration)

## Testing
- Create actor in Strategic view, verify appears in Value Stream
- Drag actor in Value Stream, verify position updates in Strategic view
- Same for user needs
- Verify connections between actors/needs render in both views

## Design Notes

### Shared Positioning System
Actors and user needs will use the same dual positioning system as bounded contexts:
- `positions.flow.x` - horizontal position in Value Stream view (0-100)
- `positions.strategic.x` - horizontal position in Strategic view (0-100)
- `positions.shared.y` - vertical position shared across both views (0-100)

### Visual Layout Recommendations
- **Actors**: Top layer (y ≈ 5-15)
- **User Needs**: Middle layer (y ≈ 15-30)
- **Contexts**: Bottom layer (y ≥ 40)

Users maintain vertical spacing manually by dragging entities up/down. No automatic layout enforcement.

### Connection Rendering
- Actor → User Need connections render in both views
- User Need → Context connections render in both views
- No connections between actors/needs and flow stages

## Implementation Strategy

1. **Phase 1: Type System & Store** (breaking changes, handle first)
   - Update type definitions
   - Update all store actions
   - Update undo/redo command payloads

2. **Phase 2: Canvas Rendering**
   - Update node creation logic
   - Update drag handlers
   - Remove view-specific conditionals

3. **Phase 3: Data Migration**
   - Update all example projects
   - Add migration logic if needed for user projects

4. **Phase 4: UI Polish**
   - Update Inspector Panel
   - Update toolbar
   - Test all interactions
