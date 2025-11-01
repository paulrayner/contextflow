# Specification: Temporal Evolution Feature

## Goal

Define the behavioral requirements for ContextFlow's temporal evolution feature. This spec describes **what users can do** and **how the system must behave**, independent of implementation details.

---

## Core Concepts

### Temporal Keyframe

A **keyframe** is a discrete snapshot of the map at a specific date, capturing:
- The date (e.g., "2027-06-15")
- An optional label (e.g., "Post-platform migration")
- The position of every context at that point in time
- Which contexts exist (some may not exist yet, others may be deprecated)

### Time Slider

The **time slider** is a UI control that lets users scrub through time:
- Shows a horizontal timeline from earliest to latest keyframe
- Current position indicates which date is being viewed
- Snaps to keyframe dates when near them
- Always defaults to today's date when temporal mode is first enabled

### Interpolation

When viewing a date **between two keyframes**, the system calculates interpolated positions:
- Linear interpolation by default
- Smooth animation as the slider moves
- Contexts that don't exist at the current date are hidden or ghosted

---

## Feature Toggle

### Enabling Temporal Mode

**Requirement:** Users must be able to enable/disable temporal evolution on a per-project basis.

**Behavior:**
- Default: temporal mode is **disabled** for new projects
- When disabled: time slider is hidden, all contexts show at their base positions
- When enabled: time slider appears, defaults to today's date
- Toggle is accessible from the top bar or project settings

**Rationale:** Not all projects need temporal evolution. Keep the UI clean for users who only need current-state mapping.

---

## Keyframe Management

### Creating a Keyframe

**Requirement:** Users can create a keyframe at any future date.

**Trigger options:**
1. Click "Add Keyframe" button → prompts for date
2. Drag slider to desired date → click "Create keyframe here"
3. Right-click on slider track → "Add keyframe at [date]"

**Behavior when creating a keyframe:**
- If no keyframes exist: use current positions as the starting state
- If keyframes exist: copy positions from the nearest existing keyframe
- User can immediately drag contexts to new positions
- Keyframe is saved with a default label (editable)

**Validation:**
- Date must be in the future (or today at minimum)
- Date cannot duplicate an existing keyframe date
- System warns if creating a keyframe more than 10 years in the future

### Editing a Keyframe

**Requirement:** Users can modify positions and metadata of existing keyframes.

**How to edit positions:**
1. Move slider to the keyframe date (snaps/locks to it)
2. Drag contexts on the canvas
3. Changes save only to that keyframe (other keyframes unaffected)

**How to edit metadata:**
- Click keyframe marker on slider → popup shows:
  - Date (editable)
  - Label (editable)
  - "Delete keyframe" button

**Behavior:**
- Changing a keyframe date re-sorts it in the timeline
- Deleting a keyframe removes it entirely (interpolation adjusts)
- Cannot delete the "today" keyframe (it's implicit)

### Viewing All Keyframes

**Requirement:** Users can see a list of all keyframes in the project.

**Access:** "Manage Keyframes" panel/modal from top bar or temporal controls

**Display:**
- List sorted by date (earliest to latest)
- Each entry shows:
  - Date
  - Label
  - Number of contexts that exist at that keyframe
  - "Jump to" / "Edit" / "Delete" actions

---

## Time Slider Interaction

### Default State

**Requirement:** When temporal mode is first enabled, the slider defaults to today's date.

**Behavior:**
- If no keyframes exist: map shows current (base) positions, nothing different
- Moving the slider initially does nothing (no future states defined yet)
- Prompt: "Add a keyframe to project future evolution"

### Scrubbing the Timeline

**Requirement:** Users can drag the slider to any date between keyframes and see interpolated positions.

**Behavior:**
- Smooth animation as slider moves
- Contexts transition between keyframe positions
- Interpolation is linear (easing optional enhancement)
- Dates outside keyframe range clamp to earliest/latest keyframe

**Visual feedback:**
- Current date label updates as slider moves
- Active keyframe (if locked to one) is highlighted
- Contexts animate horizontally and vertically

### Snapping to Keyframes

**Requirement:** The slider should snap to keyframe dates when near them.

**Behavior:**
- When slider is within ~5% of a keyframe date, it snaps
- Visual indicator shows "Locked to keyframe: [label]"
- Dragging contexts while locked edits that keyframe
- Dragging slider away unlocks and shows interpolated state

**Rationale:** Makes it easy to land precisely on a keyframe for editing without pixel-perfect accuracy.

---

## Canvas Behavior with Temporal Evolution

### Positioning Rules

**Requirement:** Context positions must respect the current slider date.

**Behavior:**
- Each context has a **base position** (stored in its data)
- Each keyframe can **override** positions for contexts
- At any slider date:
  - If on a keyframe: use keyframe positions
  - If between keyframes: interpolate linearly
  - If before earliest keyframe: use base positions
  - If after latest keyframe: use latest keyframe positions

**Which positions are affected:**
- `positions.strategic.x` (Strategic View horizontal)
- `positions.flow.x` (Flow View horizontal)
- `positions.shared.y` (vertical, shared across both views)

### Dragging Contexts in Temporal Mode

**Requirement:** Dragging a context updates positions for the current keyframe only.

**Behavior:**
- If slider is **locked to a keyframe**: dragging updates that keyframe
- If slider is **between keyframes**: system prompts:
  - "Create a keyframe at [current date] to edit positions?"
  - Or: "Lock to nearest keyframe to edit?"
- Dragging in base/non-temporal mode: updates base positions

**Validation:**
- Cannot drag contexts when viewing interpolated state (must lock to keyframe first)

### Contexts That Appear/Disappear Over Time

**Requirement:** Some contexts may not exist at all keyframes (new contexts appear, deprecated contexts disappear).

**Behavior:**
- Each keyframe tracks `activeContextIds` (which contexts exist at that time)
- When viewing a keyframe where a context doesn't exist:
  - Context is hidden (not rendered on canvas)
- When viewing interpolated state:
  - Context fades in/out as it approaches appearance/disappearance date
  - Or: remains hidden until keyframe where it appears

**How users control this:**
- In keyframe editing mode, right-click context → "Hide in this keyframe"
- Or: "Keyframe Inspector" panel shows checkboxes for each context

**Rationale:** Enables modeling scenarios like "New Data Lake context appears in 2028" or "Legacy Auth context is decommissioned in 2030."

---

## Visualization Modes

### Animated Playback

**Requirement:** Users can auto-play the timeline to see evolution animate.

**Controls:**
- Play/Pause button
- Speed control (0.5x, 1x, 2x, 4x)
- Loop option

**Behavior:**
- Slider advances automatically from earliest to latest keyframe
- Animation respects interpolation (smooth transitions)
- Pauses briefly at each keyframe (or not, based on settings)

### Trajectory View

**Requirement:** Users can toggle a static view showing movement paths.

**Behavior when enabled:**
- For each context, draw an arrow from current position → next keyframe position
- Or: draw full path across all keyframes
- Arrow color/thickness indicates speed of movement
- Hovering a trajectory shows keyframe labels along the path

**Rationale:** Some users prefer static "before/after" comparisons to animations.

### Ghost/Preview Mode

**Requirement:** Users can see future positions overlaid on current state.

**Behavior:**
- While viewing current date, toggle "Show future ghost positions"
- Contexts render at current positions (solid)
- Ghosted outlines show where they'll be at next keyframe (semi-transparent)
- Optional: show multiple ghosts for multiple future keyframes

**Rationale:** Helps plan movements without leaving the current view.

---

## Undo/Redo Behavior

### Temporal Actions Are Undoable

**Requirement:** Temporal operations must support undo/redo.

**Actions that are undoable:**
- Creating a keyframe
- Deleting a keyframe
- Moving a context within a keyframe
- Changing keyframe date or label
- Hiding/showing a context in a keyframe

**Actions that are NOT undoable:**
- Moving the time slider (navigation, not editing)
- Toggling temporal mode on/off
- Playback controls (play/pause/speed)

**Behavior:**
- Undo stack tracks which keyframe was being edited
- Undo restores both positions and slider state (if needed)

---

## Validation and Constraints

### Date Validation

**Requirement:** System must prevent invalid temporal states.

**Rules:**
- Keyframe dates must be unique (no duplicates)
- Keyframe dates should be in chronological order (auto-sorted)
- Warning if keyframe is >10 years in the future
- Error if keyframe date is before project creation date (optional)

### Position Validation

**Requirement:** Context positions within keyframes must stay within valid ranges.

**Rules:**
- `x` values: 0–100 (percentage of canvas width)
- `y` values: 0–100 (percentage of canvas height)
- System clamps out-of-range values

### Context Existence Validation

**Requirement:** System must handle contexts being added/deleted in base project.

**Behavior:**
- If a context is deleted from the project, it's removed from all keyframes
- If a new context is added, it can optionally appear in future keyframes only
- Warning if a context exists in a past keyframe but not in the base project

---

## Persistence and Import/Export

### Autosave

**Requirement:** Temporal keyframes must autosave like all other project data.

**Behavior:**
- After any keyframe edit, project is saved to localStorage/IndexedDB
- Save includes all keyframe data (dates, labels, positions, activeContextIds)

### Export/Import

**Requirement:** Temporal data must be included in `project.json` export/import.

**Behavior:**
- Export includes `temporal` section with all keyframes
- Import validates keyframe dates and positions
- If importing project with temporal data into a version that doesn't support it: ignore gracefully (no errors)

**Data structure in JSON:**
```json
{
  "temporal": {
    "enabled": true,
    "keyframes": [
      {
        "id": "kf-1",
        "date": "2027-06-15",
        "label": "Post-migration",
        "positions": {
          "ctx-1": { "strategic": { "x": 75 }, "flow": { "x": 60 }, "shared": { "y": 40 } }
        },
        "activeContextIds": ["ctx-1", "ctx-2", "ctx-3"]
      }
    ]
  }
}
```

---

## Inspector Panel Changes

### Temporal Position Display

**Requirement:** When a context is selected, the inspector should show its position at the current slider date.

**Display:**
- Section: "Position at [current date]"
- If on keyframe: "Position in keyframe: [label]"
- If interpolated: "Interpolated position between [date1] and [date2]"
- Show x/y coordinates (or hide if too technical)

### Keyframe-Specific Metadata

**Requirement:** Users can add notes specific to a context at a keyframe.

**Behavior:**
- Each keyframe can store per-context notes (optional)
- Example: "Auth context: migrated to Auth0 in this keyframe"
- Display in inspector when viewing that keyframe

---

## View Switching with Temporal Mode

### Temporal Evolution is Strategic View Only

**Requirement:** Temporal evolution applies ONLY to Strategic View (Wardley Map).

**Behavior:**
- Keyframes store positions for **Strategic View only** (strategic.x and shared.y)
- Flow View and Distillation View positions remain constant across all keyframes
- Time slider is only visible when viewing Strategic View
- Switching to Flow View or Distillation View hides the time slider

**Rationale:**
- Strategic View shows market-driven evolution (genesis → commodity)
- Flow View shows process sequence, which is relatively stable
- Distillation View shows team structure, which evolves through different mechanisms (org changes, not market forces)

### Switching Between Views

When user switches views while temporal mode is enabled:
- **Strategic → Flow/Distillation**: Time slider disappears, contexts show their base (non-temporal) positions
- **Flow/Distillation → Strategic**: Time slider reappears at last selected date, contexts animate to temporal positions

---

## Performance Requirements

### Smooth Animation

**Requirement:** Timeline scrubbing must feel responsive.

**Targets:**
- 60 FPS animation when scrubbing slider
- No lag when dragging contexts in keyframe editing mode
- Interpolation calculations must be fast (<16ms per frame)

**Optimization strategies:**
- Throttle slider events to avoid excessive re-renders
- Precompute trajectory paths for static visualization
- Use Framer Motion for GPU-accelerated animations

### Large Projects

**Requirement:** Temporal mode must work with projects containing 100+ contexts and 10+ keyframes.

**Behavior:**
- Interpolation must scale linearly with context count
- Consider virtualization if canvas has many contexts
- Warn users if creating excessive keyframes (>20)

---

## Error Handling

### Missing Keyframes

**Scenario:** User moves slider but no keyframes exist.

**Behavior:** Show tooltip: "Add your first keyframe to project future evolution"

### Corrupted Temporal Data

**Scenario:** Imported project has invalid keyframe data.

**Behavior:**
- System logs warnings to console
- Ignores invalid keyframes
- User can still use the rest of the project

### Browser Compatibility

**Scenario:** User's browser doesn't support required features (e.g., older Safari).

**Behavior:**
- Graceful degradation: temporal controls are hidden
- Show message: "Temporal evolution requires a modern browser"

---

## Non-Goals for MVP

To keep scope manageable, the MVP **will not include**:

- **Scenario branching**: Multiple timelines (optimistic/pessimistic)
- **Live data integration**: Tracking actual evolution vs planned
- **Collaboration**: Shared keyframes across team members
- **Advanced interpolation**: Bezier curves or custom easing
- **Relationship evolution**: Changing relationships over time (only positions change)
- **Group evolution**: Groups remain static across keyframes

These may be added in future iterations based on user feedback.

---

## Success Criteria

The temporal evolution feature is successful if:

1. **Functional:** Users can create keyframes, scrub timeline, and see smooth interpolation
2. **Intuitive:** First-time users understand the keyframe model without extensive documentation
3. **Performant:** Animation is smooth (60 FPS) even with 50+ contexts
4. **Stable:** No crashes or data loss when creating/editing/deleting keyframes
5. **Adopted:** >30% of active projects enable temporal mode within 3 months of launch

---

## Open Questions

Before implementation, we need to decide:

1. **Should relationships evolve over time?** (e.g., relationship appears in 2027 keyframe)
2. **Should groups evolve?** (membership changes, groups appear/disappear)
3. **How to handle "impossible" states?** (e.g., context positioned outside canvas bounds in a keyframe)
4. **Should we warn about unrealistic evolution?** (e.g., component moving from genesis to commodity in 6 months)
5. **How to visualize contexts that don't exist yet?** (ghosted, dotted outline, special badge?)

These questions should be resolved during design phase, informed by user testing.

---

## Implementation Notes

### Data Model

```typescript
interface TemporalKeyframe {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  label?: string; // e.g., "Post-migration", "After platform consolidation"

  // ONLY Strategic View positions are stored in keyframes
  positions: {
    [contextId: string]: {
      x: number;  // Strategic View horizontal (evolution axis)
      y: number;  // Vertical (value chain proximity)
    };
  };

  // Contexts that exist at this keyframe
  activeContextIds: string[];
}

interface Project {
  // ... existing fields ...

  temporal: {
    enabled: boolean;
    keyframes: TemporalKeyframe[]; // sorted by date ascending
  };
}
```

**Note:** Flow View and Distillation View positions are NOT stored in keyframes. They remain constant using the base `positions.flow` and `positions.distillation` from each BoundedContext.

### Interpolation Logic

Linear interpolation between keyframes for Strategic View only:

```typescript
function getInterpolatedPosition(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[]
): { x: number; y: number } | null {
  // Find surrounding keyframes
  const before = findKeyframeBefore(targetDate, keyframes);
  const after = findKeyframeAfter(targetDate, keyframes);

  if (!before) return after.positions[contextId];
  if (!after) return before.positions[contextId];

  // Linear interpolation
  const progress = calculateProgress(targetDate, before.date, after.date);

  return {
    x: lerp(before.positions[contextId].x,
            after.positions[contextId].x,
            progress),
    y: lerp(before.positions[contextId].y,
            after.positions[contextId].y,
            progress)
  };
}
```

This interpolated position is used ONLY in Strategic View. Flow View and Distillation View always use base positions.

### UI Components Needed

New components to build:
- `<TimeSlider />` - Main time scrubbing control with keyframe markers (only visible in Strategic View)
- `<KeyframeMarker />` - Visual indicator on slider track
- `<KeyframeManager />` - Panel to list/edit/delete keyframes
- `<TrajectoryOverlay />` - Shows movement paths between keyframes (Strategic View only)
- `<TemporalControls />` - Play/pause, speed, view mode toggles (Strategic View only)

Modified components:
- `<CanvasArea />` - When in Strategic View with temporal mode, use interpolated positions; otherwise use base positions
- `<TopBar />` - Add temporal mode toggle (affects Strategic View only)
- `<InspectorPanel />` - Show "Position at [date]" only when viewing Strategic View with temporal mode active

### Technical Considerations

**Data consistency:**
- If a context is deleted from base project, remove from all keyframes
- Validate keyframe dates are unique and sorted
- Handle edge cases (context exists in future keyframe but not current state)

**View isolation:**
- Keyframes only affect Strategic View
- Flow View and Distillation View are unaffected by temporal mode
- Time slider only appears when Strategic View is active

**Performance:**
- Throttle slider scrubbing to avoid excessive re-renders
- Use Framer Motion for GPU-accelerated animations
- Precompute trajectory paths for static visualization mode
- No performance impact on Flow/Distillation views (they don't interpolate)
