# UX Guidelines

This document defines the **user experience principles, interaction semantics, and visual conventions** for the ContextFlow application.  
It specifies *how* users interact with and perceive the system.

## Purpose

ContextFlow is a **visual facilitation and analysis tool** for mapping bounded contexts, their relationships, and team ownership within complex software systems.

Its UX must make these maps:
- **Intuitive** — easy to draw, move, and interpret.
- **Expressive** — visually encode key DDD semantics (core, supporting, generic; strong/weak boundaries, etc.).
- **Lightweight** — no friction or ceremony for users.
- **Professional** — suitable for use in consulting, workshop, or executive settings.

The UX is inspired by **Miro**, **Wardley Maps**, and the **Linear** aesthetic: minimal, elegant, and focused.

## Design Philosophy

> "Map what *is*, not what *should be* — and make that map effortless to navigate."

1. **The diagram is the UI.**
   The canvas is the primary interface; all interaction should feel natural and immediate.

2. **Clarity over decoration.**
   Visual language communicates meaning (color, shape, border) without excess styling.

3. **Show only meaningful information.**
   Don't display UI elements or empty states that provide no value to the user. If there's nothing useful to show, hide it.

4. **Direct manipulation.**
   Users should never feel constrained — moving, resizing, and editing should feel smooth and reversible.

5. **Respect cognitive flow.**
   The user's focus moves from *overview → detail* naturally; no hidden hierarchies.

6. **Facilitator-first.**
   Optimized for domain mapping conversations, not data entry.

## Interaction Semantics

### Canvas Behavior
- **Pan & Zoom:** Standard trackpad/mouse gestures via React Flow.
- **Drag Context:** Moves a bounded context node.
  - Horizontal drag → changes X coordinate for current view (Value Stream/Distillation/Strategic).
  - Vertical drag → changes Y coordinate (shared between Value Stream and Strategic; independent for Distillation).
- **Multi-select:** Shift+click to select multiple contexts. Drag to move as a group with maintained relative positions.
- **Drag-to-connect:** Click and drag from one context to another to create a relationship edge.
- **Select Entity:** Click context/relationship/group/actor/user need to open Inspector Panel (right sidebar).
- **Deselect:** Click empty canvas or press `Esc`.
- **Undo/Redo:** Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z for structural changes (add/move/delete context, relationships, repo assignments, groups, keyframes).
- **Autosave:** Changes persist automatically to IndexedDB (Miro-like).

### View Modes
Three synchronized views of the same system model:

- **Value Stream View (default):** X-axis = configurable flow stages (e.g., Discovery → Selection → Purchase → Fulfillment). Shows how value flows through the system. Stages are editable via TopBar.
- **Distillation View:** X-axis = Model Complexity (low → high), Y-axis = Business Differentiation (low → high). Core Domain Chart for classifying domains (core/supporting/generic).
- **Strategic View:** X-axis = Wardley evolution (Genesis → Custom-built → Product → Commodity). Shows three-layer value chain: Actors → User Needs → Contexts.
- Toggle via top bar button. View transitions animate smoothly.

### Relationships
- **Curved edges (Bézier)** auto-routed around nodes.
- Arrows point toward **upstream** contexts (semantic direction).
- Non-directional (shared kernel, partnership) edges have no arrow.
- Hovering an edge shows pattern name (e.g., "Conformist").
- Click edge to select and edit in Inspector Panel (pattern type, communication mode, description).

### Strategic View Value Chain
- **Actors:** Octagonal nodes at top of canvas. Represent users/stakeholders of the map. Connect to User Needs below.
- **User Needs:** Rounded rectangular nodes in middle layer. Represent problems/jobs to be done. Connect Actors to Contexts.
- **Contexts:** Standard bounded context nodes at bottom. Positioned on evolution axis (X) and value chain (Y).
- **2-hop highlighting:** Selecting an Actor highlights connected Needs and their Contexts. Selecting a Need highlights its Actor and Contexts.
- Visual hierarchy: Actor → Need connections (thin, subtle) vs Need → Context connections (standard weight).

### Temporal Evolution
- **Timeline slider:** Appears at bottom of canvas when temporal mode is enabled. Shows keyframes as markers along timeline.
- **Keyframe scrubbing:** Drag slider to move through timeline. Canvas interpolates between keyframes smoothly.
- **Playback controls:** Play/pause button for animated playback through all keyframes.
- **Keyframe management:** Add keyframe (captures current state), delete keyframe, jump to specific keyframe.
- **Visual feedback:** Ghost nodes show previous/next positions during scrubbing. Timeline marker highlights current position.
- **Undo/redo support:** Keyframe creation/deletion is undoable.

### Groups (Capability Clusters)
- **Organic blob rendering:** Groups use Catmull-Rom curve smoothing to create natural, blob-shaped boundaries around member contexts.
- **Visual styling:** Translucent fill with colored border. Label and optional note displayed inside group boundary.
- **Non-destructive deletion:** Deleting a group removes only the visual hull; member contexts remain on canvas.
- **Membership management:** Add/remove contexts individually or in batch operations. Groups can overlap (multiple groups covering same canvas area).
- **Selection and editing:** Click group to select and edit in Inspector Panel (name, note, color).

## Visual Language

| Property | Meaning | Visual Encoding |
|-----------|----------|-----------------|
| **Fill color** | Strategic classification | Core → soft gold `#f8e7a1`<br>Supporting → pale blue `#dbeafe`<br>Generic → light gray `#f3f4f6` |
| **Border style** | Boundary integrity | Strong → thick solid<br>Moderate → medium solid<br>Weak → dashed |
| **Node size** | Codebase size / complexity | tiny → huge (progressively larger radius) |
| **Badges** | Metadata indicators | ⚠ Legacy badge (neutral styling, no red)<br>"External" pill + dotted ring |
| **Groups** | Capability clusters | Organic blob-shaped hulls (Catmull-Rom smoothing) with label + note. Translucent fill, colored border. Deleting a group does not delete member contexts. |

## Layout and Composition

| Area | Purpose | Notes |
|-------|----------|-------|
| **Top Bar** | View toggle, project switcher, flow stage editor, temporal controls | Light background, minimal icons |
| **Left Sidebar** | Repo list / Unassigned repos | Collapsible, scrollable. Shows CodeCohesion API stats when available. |
| **Center Canvas** | Main map visualization | Infinite plane, pan/zoom enabled |
| **Right Sidebar (Inspector)** | Entity details | Edit context/relationship/group/actor/user need properties |
| **Background Grid** | View-specific axes | Subtle gridlines + axis labels. Changes based on current view. |
| **Timeline Slider** | Temporal evolution controls | Bottom of canvas when temporal mode enabled. Keyframe scrubbing + playback. |

**Axes**
- **Value Stream View:**
  - X-axis: User-defined flow stage labels (e.g., "Discovery", "Selection", "Purchase", "Fulfillment"). Editable via TopBar.
  - Y-axis: Shared value chain position (top → bottom).
- **Distillation View:**
  - X-axis: Model Complexity (low → high).
  - Y-axis: Business Differentiation (low → high).
  - Quadrant labels: Generic (low/low), Supporting (high/low), Core (high/high).
- **Strategic View:**
  - X-axis: Wardley evolution stages ("Genesis", "Custom-Built", "Product/Rental", "Commodity/Utility").
  - Y-axis: Shared value chain position (top → bottom).
  - Three vertical layers: Actors (top), User Needs (middle), Contexts (bottom).

## Component Roles

| Component | Responsibility |
|------------|----------------|
| **CanvasArea.tsx** | Render nodes (contexts/actors/user needs), relationships, and groups via React Flow |
| **InspectorPanel.tsx** | Display and edit metadata for selected entity (context/relationship/group/actor/user need) |
| **RepoSidebar.tsx** | Manage and assign repositories with drag-and-drop. Show CodeCohesion API stats. |
| **TopBar.tsx** | Global controls: view toggle, project switcher, flow stage editor, temporal mode toggle |
| **TimelineSlider.tsx** | Keyframe management, scrubbing, and playback controls |
| **App.tsx** | Layout composition, responsive sizing, and entity selection routing to Inspector |

## Aesthetic Guidelines

- Neutral tone (white, gray, muted blue).
- Rounded corners, soft shadows, generous spacing.
- Typography: system sans-serif (SF Pro / Inter).
- No bright accent colors — highlight meaning through shape and line weight.
- lucide-react icons for consistency.
- Subtle transitions (Framer Motion) for node movement and mode switch.
- Light and dark mode supported via Tailwind’s `dark:` classes.

## Persistence and Behavior

- **Local-first persistence:** IndexedDB storage with Miro-style autosave.
- **Multi-project support:** Project switcher dropdown in TopBar. Each project has isolated state.
- **Undo/redo history:** Per project session. Applies to structural changes only (add/move/delete context, relationships, repo assignments, groups, keyframes). Text edits in Inspector autosave directly and are not undoable.
- **Import/export:** JSON format for project data. No YAML or other formats in current version.
- **CodeCohesion API:** Optional integration for live repository statistics and contributor data.

## Accessibility and Usability

- Sufficient contrast for all text and borders.
- Visual indicators (border highlight) for selected elements.
- All controls accessible via keyboard.
- Descriptive tooltips for relationships and context labels.
- Avoid visual clutter; prioritize information density balance.

## 🔮 Future UX Enhancements

- **Filtering and highlighting:** Filter canvas by team, ownership, or relationship type.
- **Alignment guides:** Visual guides and snapping for precise node positioning.
- **Auto-layout options:** Automatic graph layout algorithms for large maps.
- **Context-level comments:** Inline annotations and discussion threads.
- **Keyboard shortcuts overlay:** Discoverable documentation for power users.
- **Enhanced accessibility:** Screen reader support, keyboard-only navigation improvements.
- **Collaborative editing:** Real-time multi-user editing with conflict resolution.
