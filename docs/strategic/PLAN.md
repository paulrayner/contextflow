# Plan: Temporal Evolution

## Status: Milestone 1 Complete ✅ | Milestones 2-4 Planned

**Completed:** Basic temporal infrastructure (v0.4.0, Nov 2025)
**Next:** Interpolation polish, keyframe management UI, visualization enhancements

## Purpose

This is the implementation roadmap for ContextFlow's Temporal Evolution feature. Temporal Evolution adds time-based visualization to Strategic View, allowing users to define keyframes at strategic dates and visualize how bounded contexts evolve over time.

Each milestone delivers independently valuable functionality that can be demoed and tested. The sequence builds from basic infrastructure through to advanced visualization features.

**Note:** This feature is built on top of ContextFlow's core functionality (Milestones 1-3 from main PLAN.md). It requires Strategic View to be implemented.

---

## Milestone 1: Basic Temporal Infrastructure ✅ COMPLETE

### Goal

Enable temporal mode and allow users to create their first keyframe showing a future state of the Strategic View map.

### Deliverables

**Toggle Temporal Mode:**
- Add "Enable Temporal Mode" toggle in TopBar (only visible when Strategic View is active)
- Store temporal.enabled flag in Project
- Visual indicator when temporal mode is active

**Time Slider UI:**
- Implement `<TimeSlider />` component at bottom of Strategic View canvas
- Display year markers (current year ± 10 years)
- Show draggable handle at current year by default
- Slider only visible when temporal mode enabled and Strategic View active

**Create First Keyframe:**
- "Add Keyframe" button in TopBar or on time slider
- Prompt for date (year format: "2027") and optional label
- Store keyframe with current Strategic View positions as starting point
- Validate: date must be unique, properly formatted

**Keyframe Storage:**
- Add `temporal.keyframes` array to Project data model
- Each keyframe stores:
  - id, date, label
  - positions (contextId → x, y)
  - activeContextIds (which contexts exist)
- Keyframes auto-sorted by date

**Visual Keyframe Marker:**
- Show marker on time slider track at keyframe date
- Clicking marker "locks" to that keyframe (for future editing)
- Hover shows keyframe label

**Persistence:**
- Temporal data included in project.json export/import
- Autosave to IndexedDB includes keyframes
- Backward compatible: projects without temporal field work normally

### User Flow

1. User working in Strategic View
2. Click "Enable Temporal Mode" → time slider appears at bottom
3. Slider shows current year (2025)
4. Click "Add Keyframe" → enter "2027" and label "Post-migration"
5. Keyframe created with current positions
6. Marker appears on slider at 2027 position

### Result

At the end of Milestone 1, users can:
- Enable temporal mode in Strategic View
- Create keyframes at future dates
- See keyframe markers on the timeline
- Save projects with temporal data

This establishes the foundation for time-based visualization.

---

## Milestone 2: Interpolation and Animation

### Goal

Bring keyframes to life by interpolating positions between them and animating context movement as users scrub the timeline.

### Deliverables

**Position Interpolation:**
- Implement `interpolatePosition(contextId, targetDate, keyframes)` function
- Linear interpolation between surrounding keyframes
- Handle edge cases:
  - Before first keyframe: use base positions
  - After last keyframe: use last keyframe positions
  - No keyframes: use base positions

**Date Conversion:**
- Convert year strings to numeric values for math
- Support year-only dates: "2027" → 2027.375 (mid-year)
- Calculate progress between two dates (0.0 to 1.0)

**Canvas Integration:**
- Modify `<CanvasArea />` position resolution:
  - When temporal mode + Strategic View: use interpolated positions
  - Otherwise: use base positions
- Positions update smoothly as slider moves

**Smooth Animation:**
- Use Framer Motion to animate context position changes
- Throttle slider scrubbing to 60 FPS
- Easing: smooth transitions, not instant jumps

**Snap to Keyframe:**
- When slider is within ~5% of keyframe date, snap to it
- Visual feedback: "Locked to keyframe: Post-migration"
- When locked, positions show exact keyframe values (no interpolation)

**Edit Keyframe Metadata:**
- Click keyframe marker → popup editor
- Edit date (validates uniqueness)
- Edit label
- Delete keyframe (with confirmation)
- Changes re-sort keyframes by date

**Inspector Panel Updates:**
- When context selected and temporal mode active:
  - Show "Position at [currentDate]" section
  - Display evolution % and value chain %
  - Indicate if viewing keyframe or interpolated state

### User Flow

1. User has keyframes at 2025 (current) and 2027
2. Drag slider to 2026 → contexts animate to interpolated positions
3. Continue scrubbing to 2027 → slider snaps to keyframe, locks
4. Click keyframe marker → edit label to "After Platform Launch"
5. Drag slider back to 2025 → watch contexts animate back

### Result

At the end of Milestone 2, users can:
- Scrub timeline and see smooth position interpolation
- Watch contexts animate between keyframes
- Edit keyframe dates and labels
- Experience the "aha!" moment of temporal visualization

This delivers the core value proposition of temporal evolution.

---

## Milestone 3: Keyframe Management

### Goal

Enable users to edit keyframe positions, manage multiple keyframes, and control context visibility over time.

### Deliverables

**Edit Keyframe Positions:**
- When slider locked to a keyframe, dragging contexts updates that keyframe
- Visual indicator: "Editing keyframe: 2027 - Post-migration"
- Changes save only to active keyframe (other keyframes unaffected)
- Dragging when NOT locked prompts: "Lock to keyframe to edit positions"

**Keyframe List Panel:**
- Implement `<KeyframeManager />` component (modal or side panel)
- Display all keyframes sorted by date
- Each entry shows:
  - Date and label
  - Number of contexts that exist at this keyframe
  - Actions: Edit, Delete, Jump To
- "Add Keyframe" button opens date/label entry form

**Context Visibility per Keyframe:**
- Each keyframe tracks `activeContextIds`
- Contexts not in list are hidden at that keyframe
- UI: When editing keyframe, right-click context → "Hide in this keyframe"
- Or: Keyframe editor shows checklist of all contexts (show/hide toggles)

**Appearance/Disappearance Animation:**
- When scrubbing past a context's appearance date: fade in
- When scrubbing past a context's disappearance date: fade out
- Smooth opacity transition during interpolation

**Undo/Redo for Temporal Actions:**
- Add undo support for:
  - Create keyframe
  - Delete keyframe
  - Move context within keyframe
  - Edit keyframe date/label
  - Show/hide context in keyframe
- Temporal navigation (moving slider) is NOT undoable

**Copy Keyframe:**
- "Duplicate keyframe" action in KeyframeManager
- Creates new keyframe at different date with same positions
- Useful for: "Copy 2027 state to 2030 as starting point"

**Validation:**
- Warn if keyframe is >10 years in future
- Prevent duplicate keyframe dates
- Validate date format (year or year-quarter)
- Handle deleted contexts (remove from keyframes)

### User Flow

1. User opens Keyframe Manager panel
2. Sees 3 keyframes: 2025, 2027, 2030
3. Click "2027" → slider jumps to it, locks
4. Drag Auth context to right (more evolved)
5. Right-click Legacy Monolith context → "Hide in this keyframe"
6. Monolith disappears (represents deprecation)
7. Scrub to 2028 → monolith fading out as it approaches 2030
8. Undo → monolith reappears

### Result

At the end of Milestone 3, users can:
- Manage multiple keyframes in a timeline
- Edit positions for specific keyframes
- Show contexts appearing/disappearing over time
- Undo temporal changes
- Build complex evolution narratives

This makes temporal evolution a production-ready feature.

---

## Milestone 4: Visualization Enhancements

### Goal

Add advanced visualization modes and performance optimizations for professional presentations and large projects.

### Deliverables

**Trajectory Overlay:**
- Implement `<TrajectoryOverlay />` component
- Toggle: "Show trajectory paths"
- For each context, draw arrow from current → next keyframe position
- Arrow styling:
  - Color: context's strategic classification color
  - Thickness: indicates speed (large movement = thick arrow)
  - Dashed: for contexts that will disappear
- Hover arrow → shows start/end keyframe labels

**Animated Playback:**
- Implement `<TemporalControls />` component
- Play/Pause button: auto-advance slider from current to latest keyframe
- Speed control: 0.5x, 1x, 2x, 4x
- Loop toggle: restart from beginning when reaching end
- Progress indicator during playback

**Playback Logic:**
- Advance slider in small increments (smooth animation)
- Pause briefly at each keyframe (optional)
- Allow manual scrubbing during playback (pauses)

**Ghost Preview Mode:**
- Toggle: "Show future positions"
- While viewing current state, show ghosted outlines at next keyframe
- Semi-transparent, dotted border
- Helps plan movements without leaving current view

**Quarter Granularity Support:**
- Update date input to accept quarters: "2027-Q2"
- Update slider to show quarter markers (optional detail level)
- Zoom slider: Year view vs Quarter view
- Interpolation handles quarters correctly

**Performance Optimizations:**
- Cache interpolated positions (invalidate on keyframe change)
- Precompute trajectory paths (recalculate only when needed)
- Throttle slider scrubbing aggressively for large projects
- Consider virtualization for trajectory overlay if >100 contexts

**Export Timeline:**
- "Export Timeline" action
- Generate animated GIF or video of evolution (future)
- For MVP: export series of PNG screenshots at each keyframe
- Useful for presentations and documentation

**Visual Polish:**
- Smooth transitions between visualization modes
- Loading states for heavy interpolation
- Improved keyframe marker design (colored by label category?)
- Timeline zoom controls

### User Flow

1. User has built complex evolution timeline with 5 keyframes
2. Toggle "Show trajectories" → see all movement paths at once
3. Click Play → watch contexts smoothly evolve from 2025 to 2032
4. Adjust speed to 2x → faster animation
5. Pause at 2028 → manually drag slider to explore
6. Toggle "Show future positions" → see where contexts will be in 2030
7. Export timeline → get PNG series for slide deck

### Result

At the end of Milestone 4, users can:
- Present evolution visually with animated playback
- See all movement paths at a glance
- Use quarter granularity for precise roadmap planning
- Export visualizations for stakeholder presentations
- Work with large projects (100+ contexts) smoothly

This makes temporal evolution a polished, professional feature ready for consulting and strategic planning.

---

## Dependencies

### On Core ContextFlow Features

Temporal Evolution requires:
- ✅ Strategic View (Milestone 2 from main PLAN.md)
- ✅ Canvas with context positioning (Milestone 1)
- ✅ State management (Zustand store)
- ✅ Project persistence (IndexedDB)
- ✅ Undo/redo infrastructure (Milestone 2)

**Recommendation:** Build Temporal Evolution after Core Milestones 1-2 are complete.

### Between Temporal Milestones

- Milestone 2 requires Milestone 1 (can't interpolate without keyframes)
- Milestone 3 requires Milestone 2 (editing needs interpolation working)
- Milestone 4 can be built incrementally (each enhancement is independent)

---

## Testing Strategy

### Milestone 1

- Create keyframe and verify storage
- Toggle temporal mode on/off
- Export/import project with temporal data
- Backward compatibility: load old projects without temporal field

### Milestone 2

- Interpolation math correctness (unit tests)
- Animation smoothness (visual inspection)
- Snap-to-keyframe behavior
- Edit keyframe date (validation, re-sorting)

### Milestone 3

- Drag context in keyframe (stores correctly)
- Hide/show context per keyframe
- Undo/redo temporal actions
- Delete keyframe (interpolation adjusts)

### Milestone 4

- Trajectory overlay performance (100+ contexts)
- Playback animation smoothness
- Quarter granularity parsing and interpolation
- Export timeline (file generation)

---

## Open Questions

These should be resolved during implementation, informed by user testing:

1. **Should relationships evolve over time?**
   - Current plan: Relationships are static across keyframes
   - Future: Could add/remove relationships in keyframes
   - Trade-off: Complexity vs expressiveness

2. **Should groups evolve?**
   - Current plan: Groups are static
   - Future: Group membership could change (contexts join/leave groups)
   - Use case: Showing platform consolidation over time

3. **How to visualize unrealistic evolution?**
   - Warn if component moves genesis → commodity in <2 years?
   - Suggest "this seems fast" when detecting unusual velocity?

4. **Default keyframe behavior?**
   - When creating first keyframe, should it copy current positions or start fresh?
   - Current plan: Copy current positions (easier to modify)

5. **Fade vs hide for disappearing contexts?**
   - Current plan: Fade out/in smoothly
   - Alternative: Instant hide/show at keyframe boundary

---

## Success Criteria

Temporal Evolution is successful if:

1. **Functional:**
   - Users can create keyframes and scrub timeline smoothly
   - Interpolation is mathematically correct
   - Performance is acceptable (60 FPS) with 50+ contexts

2. **Intuitive:**
   - First-time users understand keyframe model without extensive docs
   - Common workflows (add keyframe, edit positions, playback) feel natural

3. **Valuable:**
   - Users report using temporal mode for roadmap planning
   - Architecture consultants use it in client presentations
   - Platform teams align delivery roadmap to ContextFlow keyframes

4. **Adopted:**
   - >30% of active projects enable temporal mode within 3 months
   - Average 3-5 keyframes per temporal-enabled project
   - Users spend significant time in Strategic View (not just Flow View)

5. **Stable:**
   - No crashes or data loss when creating/editing/deleting keyframes
   - Temporal projects export/import reliably
   - Undo/redo works correctly for all temporal actions
