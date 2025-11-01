# Architecture: Temporal Evolution

## Overview

Temporal Evolution is a feature that adds time-based animation to ContextFlow's Strategic View (Wardley Map). It allows users to define discrete keyframes at strategic dates (years or quarters) showing how bounded contexts evolve over time, then visualize the animated transition between those keyframes.

**Core principle:** Evolution happens slowly, measured in years and quarters. The architecture reflects this by storing sparse keyframes and interpolating smoothly between them.

**Scope:** This feature affects ONLY Strategic View. Flow View and Distillation View remain static.

---

## Design Philosophy

### Keyframe-Based Model

Instead of tracking every position change over time, we use **discrete keyframes** (inspired by animation software):
- Each keyframe captures a snapshot at a specific date
- Linear interpolation generates intermediate positions
- Sparse data structure (only store meaningful milestones)
- Users think in terms of "2027 state" vs "2030 state"

### Progressive Disclosure

- Time slider is always visible when temporal mode is enabled (in Strategic View)
- Slider defaults to current year
- Moving slider does nothing until user creates first keyframe
- This makes temporal thinking unavoidable without overwhelming new users

### View Isolation

- Temporal evolution is a Strategic View concern (market-driven commoditization)
- Flow View positions don't change over time (process sequence is relatively stable)
- Time slider only appears when Strategic View is active
- No performance impact on other views

---

## Tech Stack

**No new dependencies required.** Temporal evolution uses existing ContextFlow technologies:

- **React** - Component structure
- **TypeScript** - Type safety for temporal data
- **Zustand** - Store temporal state
- **Framer Motion** - Animate position transitions
- **Radix UI / shadcn/ui** - Time slider component
- **React Flow** - Canvas rendering (no changes needed)
- **IndexedDB** - Persist keyframes with project data

---

## Data Model

### Temporal Keyframe

```typescript
interface TemporalKeyframe {
  id: string;
  date: string; // Year or Year-Quarter: "2027" or "2027-Q2"
  label?: string; // User-provided description

  // Strategic View positions only
  positions: {
    [contextId: string]: {
      x: number; // Evolution axis (0-100)
      y: number; // Value chain proximity (0-100)
    };
  };

  // Which contexts exist at this point in time
  activeContextIds: string[];
}
```

**Date Format:**
- `"2027"` - Entire year
- `"2027-Q2"` - Specific quarter (Q1, Q2, Q3, Q4)
- Regex: `^\d{4}(-Q[1-4])?$`
- Stored as string for easy serialization/comparison

**Position Storage:**
- Only stores positions that differ from base positions
- Missing contextId → use base position from BoundedContext
- Sparse storage for efficiency

**Active Contexts:**
- Allows contexts to appear/disappear over time
- Genesis innovations appear in future keyframes
- Deprecated capabilities disappear in future keyframes

### Project Extensions

```typescript
interface Project {
  // ... existing fields ...

  temporal?: {
    enabled: boolean;
    keyframes: TemporalKeyframe[]; // sorted by date ascending
  };
}
```

**Optional field:** Projects without temporal data work normally (backward compatible).

### Store State Extensions

```typescript
interface EditorState {
  // ... existing fields ...

  temporal: {
    currentDate: string | null; // Current slider position ("2027" or "2027-Q2")
    isPlaying: boolean; // Animation playback active
    playbackSpeed: number; // 0.5x, 1x, 2x, 4x
    showTrajectories: boolean; // Show movement paths overlay
    activeKeyframeId: string | null; // Currently locked keyframe for editing
  };
}
```

**State management:**
- `currentDate`: Which date the slider is showing (drives interpolation)
- `isPlaying`: Auto-advance slider for playback mode
- `activeKeyframeId`: When non-null, user is editing a specific keyframe

---

## Component Architecture

### New Components

#### `<TimeSlider />`

**Purpose:** Main timeline scrubbing control

**Appearance:**
- Horizontal slider at bottom of canvas (when Strategic View active)
- Year markers along track (2024, 2025, 2026...)
- Keyframe markers as distinct visual elements
- Current date indicator
- Snap-to-keyframe behavior

**Props:**
```typescript
interface TimeSliderProps {
  currentDate: string;
  keyframes: TemporalKeyframe[];
  onDateChange: (date: string) => void;
  onKeyframeClick: (keyframeId: string) => void;
}
```

**Behavior:**
- Drag handle scrubs through time
- Clicking keyframe marker locks to that keyframe
- Shows tooltip with keyframe label on hover
- Snaps to keyframe when within ~5% of date

#### `<KeyframeManager />`

**Purpose:** Panel for viewing/editing all keyframes

**Appearance:**
- Modal or side panel
- List of keyframes sorted by date
- Each entry shows: date, label, # contexts

**Props:**
```typescript
interface KeyframeManagerProps {
  keyframes: TemporalKeyframe[];
  onAddKeyframe: (date: string, label?: string) => void;
  onEditKeyframe: (id: string, updates: Partial<TemporalKeyframe>) => void;
  onDeleteKeyframe: (id: string) => void;
  onJumpToKeyframe: (id: string) => void;
}
```

**Actions:**
- Add new keyframe (date picker)
- Edit keyframe date/label
- Delete keyframe (with confirmation)
- Jump to keyframe (moves slider)

#### `<TemporalControls />`

**Purpose:** Playback controls for animation

**Appearance:**
- Small control bar near time slider
- Play/Pause button
- Speed selector (0.5x, 1x, 2x, 4x)
- Loop toggle

**Props:**
```typescript
interface TemporalControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
}
```

**Behavior:**
- Play: auto-advance slider from current to latest keyframe
- Pause: stop auto-advance
- Speed: control animation velocity

#### `<TrajectoryOverlay />`

**Purpose:** Visualize movement paths between keyframes

**Appearance:**
- Semi-transparent arrows overlaid on canvas
- Shows path from current keyframe → next keyframe
- Arrow thickness indicates speed of movement

**Props:**
```typescript
interface TrajectoryOverlayProps {
  contexts: BoundedContext[];
  currentKeyframe: TemporalKeyframe;
  nextKeyframe: TemporalKeyframe;
  showTrajectories: boolean;
}
```

**Rendering:**
- For each context, draw arrow from current → next position
- Use Framer Motion for smooth appearance/disappearance
- Optional: show full path across all keyframes

### Modified Components

#### `<CanvasArea />`

**Changes:**
- When temporal mode enabled + Strategic View active:
  - Calculate interpolated positions instead of using base positions
  - Pass `currentDate` to position resolver
  - Animate position changes smoothly

**Position Resolution Logic:**
```typescript
function resolvePosition(
  context: BoundedContext,
  viewMode: ViewMode,
  temporalState: TemporalState
): { x: number; y: number } {
  if (viewMode !== 'strategic' || !temporalState.enabled) {
    // Non-temporal or non-strategic: use base positions
    return viewMode === 'strategic'
      ? context.positions.strategic
      : context.positions.flow;
  }

  // Temporal Strategic View: interpolate
  return interpolatePosition(
    context.id,
    temporalState.currentDate,
    temporalState.keyframes
  );
}
```

#### `<TopBar />`

**Changes:**
- Add "Enable Temporal Mode" toggle (only when Strategic View active)
- Add "Manage Keyframes" button (opens KeyframeManager)
- Show current date when temporal mode active

**Visual Indicator:**
- When temporal mode enabled, show date in top bar (e.g., "@ 2027-Q2")

#### `<InspectorPanel />`

**Changes:**
- When temporal mode active and context selected:
  - Show "Position at [currentDate]" section
  - Indicate if viewing keyframe or interpolated state
  - Allow editing positions only when locked to keyframe

**Example:**
```
Position at 2027-Q2
├─ Evolution: 65% (Product/Rental)
├─ Value Chain: 40%
└─ [This is a keyframe - drag to edit]
```

---

## Interpolation Algorithm

### Linear Interpolation

For a given `targetDate` between two keyframes, calculate proportional position:

```typescript
function interpolatePosition(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[]
): { x: number; y: number } {
  // Find surrounding keyframes
  const before = findKeyframeBefore(targetDate, keyframes);
  const after = findKeyframeAfter(targetDate, keyframes);

  // Edge cases
  if (!before && !after) return basePosition; // No keyframes
  if (!before) return after.positions[contextId]; // Before first
  if (!after) return before.positions[contextId]; // After last

  // Calculate progress (0.0 to 1.0)
  const progress = calculateDateProgress(targetDate, before.date, after.date);

  // Linear interpolation
  const beforePos = before.positions[contextId];
  const afterPos = after.positions[contextId];

  return {
    x: lerp(beforePos.x, afterPos.x, progress),
    y: lerp(beforePos.y, afterPos.y, progress)
  };
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
```

### Date Progress Calculation

Convert year/quarter dates to numerical values for interpolation:

```typescript
function dateToNumeric(date: string): number {
  const match = date.match(/^(\d{4})(?:-Q([1-4]))?$/);
  if (!match) throw new Error('Invalid date format');

  const year = parseInt(match[1], 10);
  const quarter = match[2] ? parseInt(match[2], 10) : 2.5; // Mid-year if no quarter

  return year + (quarter - 1) / 4;
}

function calculateDateProgress(target: string, start: string, end: string): number {
  const t = dateToNumeric(target);
  const s = dateToNumeric(start);
  const e = dateToNumeric(end);

  return (t - s) / (e - s);
}
```

**Examples:**
- `"2027"` → 2027.375 (treated as Q2-Q3, mid-year)
- `"2027-Q1"` → 2027.0
- `"2027-Q4"` → 2027.75

### Context Visibility

Contexts can appear/disappear between keyframes:

```typescript
function isContextVisible(
  contextId: string,
  targetDate: string,
  keyframes: TemporalKeyframe[]
): boolean {
  const before = findKeyframeBefore(targetDate, keyframes);
  const after = findKeyframeAfter(targetDate, keyframes);

  // Check if context exists in surrounding keyframes
  const existsBefore = before?.activeContextIds.includes(contextId) ?? true;
  const existsAfter = after?.activeContextIds.includes(contextId) ?? true;

  // If exists in both, it's visible
  if (existsBefore && existsAfter) return true;

  // If only in one, fade in/out near boundary
  // (Implementation: optional fade animation)
  return existsBefore || existsAfter;
}
```

---

## Animation Strategy

### Position Transitions

Use Framer Motion to animate context positions smoothly:

```tsx
<motion.div
  animate={{
    x: interpolatedPosition.x,
    y: interpolatedPosition.y
  }}
  transition={{
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  }}
>
  {/* Context node */}
</motion.div>
```

**Performance:**
- Throttle slider scrubbing to max 60 FPS
- Use GPU-accelerated transforms
- Batch position updates

### Playback Animation

Auto-advance slider during playback:

```typescript
function usePlaybackAnimation(
  isPlaying: boolean,
  currentDate: string,
  keyframes: TemporalKeyframe[],
  playbackSpeed: number,
  onDateChange: (date: string) => void
) {
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const nextDate = calculateNextDate(currentDate, playbackSpeed);
      onDateChange(nextDate);

      // Stop at last keyframe
      if (nextDate === keyframes[keyframes.length - 1].date) {
        // Pause or loop
      }
    }, 16); // 60 FPS

    return () => clearInterval(interval);
  }, [isPlaying, currentDate, playbackSpeed]);
}
```

---

## Persistence

### JSON Serialization

Keyframes are stored in the Project JSON:

```json
{
  "id": "proj-123",
  "name": "ACME E-Commerce",
  "contexts": [...],
  "temporal": {
    "enabled": true,
    "keyframes": [
      {
        "id": "kf-1",
        "date": "2027",
        "label": "Post-platform migration",
        "positions": {
          "ctx-auth": { "x": 75, "y": 40 },
          "ctx-payment": { "x": 85, "y": 35 }
        },
        "activeContextIds": ["ctx-auth", "ctx-payment", "ctx-cart"]
      },
      {
        "id": "kf-2",
        "date": "2030-Q2",
        "label": "Full commoditization",
        "positions": {
          "ctx-auth": { "x": 90, "y": 40 },
          "ctx-payment": { "x": 95, "y": 35 }
        },
        "activeContextIds": ["ctx-auth", "ctx-payment", "ctx-cart"]
      }
    ]
  }
}
```

**Backward Compatibility:**
- Projects without `temporal` field work normally
- Importing old projects: temporal mode disabled by default

### IndexedDB Storage

Keyframes are autosaved with the rest of the project:

```typescript
async function saveProject(project: Project) {
  const db = await openDB('contextflow', 1);
  const tx = db.transaction('projects', 'readwrite');
  await tx.store.put(project);
  await tx.done;
}
```

**No special handling needed** - keyframes are part of Project structure.

---

## Undo/Redo

Temporal actions are undoable:

```typescript
interface EditorCommand {
  type: 'temporal.createKeyframe'
    | 'temporal.deleteKeyframe'
    | 'temporal.moveContext'
    | 'temporal.editKeyframe';
  payload: any;
}
```

**Undoable Actions:**
- Create keyframe
- Delete keyframe
- Move context within keyframe
- Change keyframe date/label
- Change context visibility in keyframe

**Not Undoable:**
- Moving the slider (navigation, not editing)
- Playback controls
- Toggling temporal mode on/off

---

## View Switching Behavior

### Strategic → Flow View

When user switches away from Strategic View:
1. Time slider fades out
2. Contexts animate to Flow View base positions
3. Temporal state preserved but inactive

### Flow → Strategic View

When user switches to Strategic View with temporal mode enabled:
1. Time slider fades in at last position
2. Contexts animate to interpolated temporal positions
3. Temporal state active

**State Preservation:**
- `currentDate` is preserved across view switches
- User returns to same point in timeline

---

## Performance Considerations

### Interpolation Caching

Cache interpolated positions to avoid recalculation:

```typescript
const interpolationCache = new Map<string, { x: number; y: number }>();

function getCachedPosition(contextId: string, date: string) {
  const key = `${contextId}:${date}`;
  if (!interpolationCache.has(key)) {
    interpolationCache.set(key, interpolatePosition(contextId, date, keyframes));
  }
  return interpolationCache.get(key);
}
```

**Cache Invalidation:**
- Clear cache when keyframes change
- Clear cache when contexts are added/removed

### Throttling

Throttle slider scrubbing to avoid excessive renders:

```typescript
const throttledDateChange = throttle((date: string) => {
  setCurrentDate(date);
}, 16); // 60 FPS max
```

### Large Projects

For projects with 100+ contexts:
- Interpolation is O(n) per frame (acceptable)
- Precompute trajectory paths for static visualization
- Consider virtualization if trajectory overlay has many paths

---

## Testing Strategy

### Unit Tests

- `interpolatePosition()` function
- `dateToNumeric()` conversion
- `calculateDateProgress()` math
- Keyframe sorting/validation

### Integration Tests

- Create keyframe → store updates
- Scrub slider → positions update
- Switch views → temporal state preserved
- Undo/redo temporal actions

### Visual Regression Tests

- Time slider appearance
- Context animation smoothness
- Trajectory overlay rendering

---

## Future Enhancements

**Not in MVP, but architecturally supported:**

1. **Scenario Branching**
   - Multiple timeline branches per project
   - Compare "optimistic" vs "conservative" scenarios

2. **Advanced Interpolation**
   - Bezier curves instead of linear
   - Custom easing per context

3. **Relationship Evolution**
   - Relationships appear/change pattern over time
   - More complex data model

4. **Group Evolution**
   - Group membership changes over time
   - Groups appear/disappear

5. **Live Data Integration**
   - Track actual evolution vs planned
   - Alert when components aren't evolving as expected
