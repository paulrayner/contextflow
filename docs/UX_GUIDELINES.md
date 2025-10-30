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

> “Map what *is*, not what *should be* — and make that map effortless to navigate.”

1. **The diagram is the UI.**  
   The canvas is the primary interface; all interaction should feel natural and immediate.

2. **Clarity over decoration.**  
   Visual language communicates meaning (color, shape, border) without excess styling.

3. **Direct manipulation.**  
   Users should never feel constrained — moving, resizing, and editing should feel smooth and reversible.

4. **Respect cognitive flow.**  
   The user’s focus moves from *overview → detail* naturally; no hidden hierarchies.

5. **Facilitator-first.**  
   Optimized for domain mapping conversations, not data entry.

## Interaction Semantics

### Canvas Behavior
- **Pan & Zoom:** Standard trackpad/mouse gestures via React Flow.
- **Drag Context:** Moves a bounded context node.
  - Horizontal drag → changes X coordinate for current view (Flow or Strategic).
  - Vertical drag → changes shared Y coordinate (value chain position).
- **Select Context:** Click to open Inspector Panel (right sidebar).
- **Deselect:** Click empty canvas or press `Esc`.
- **Undo/Redo:** Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z.
- **Autosave:** Changes persist automatically to LocalStorage/IndexedDB (Miro-like).

### View Modes
- **Flow View (default):** X-axis = value stream sequence (left → right).  
- **Strategic View:** X-axis = Wardley evolution (genesis → commodity).  
- **Shared Y-axis:** User proximity/value chain (top → bottom).  
- Toggle via top bar button.

### Relationships
- **Curved edges (Bézier)** auto-routed around nodes.
- Arrows point toward **upstream** contexts (semantic direction).
- Non-directional (shared kernel, partnership) edges have no arrow.
- Hovering an edge shows pattern name (e.g., “Conformist”).

## Visual Language

| Property | Meaning | Visual Encoding |
|-----------|----------|-----------------|
| **Fill color** | Strategic classification | Core → soft gold `#f8e7a1`<br>Supporting → pale blue `#dbeafe`<br>Generic → light gray `#f3f4f6` |
| **Border style** | Boundary integrity | Strong → thick solid<br>Moderate → medium solid<br>Weak → dashed |
| **Node size** | Codebase size / complexity | tiny → huge (progressively larger radius) |
| **Badges** | Metadata indicators | ⚠ Legacy badge (neutral styling, no red)<br>"External" pill + dotted ring |
| **Groups** | Subsystem grouping | Translucent rounded hulls (convex polygons) with label + note |

## Layout and Composition

| Area | Purpose | Notes |
|-------|----------|-------|
| **Top Bar** | View toggle, project name, controls | Light background, minimal icons |
| **Left Sidebar** | Repo list / Unassigned repos | Collapsible, scrollable |
| **Center Canvas** | Main map visualization | Infinite plane, pan/zoom enabled |
| **Right Sidebar (Inspector)** | Context details | Edit context properties, view repos/teams |
| **Background Grid** | Wardley-style | Subtle gridlines + axis labels always visible |

**Axes**
- X-axis (Flow View): User-defined stage labels (“Ingestion”, “Analysis”, etc.).  
- X-axis (Strategic View): Fixed evolution stages (“Genesis”, “Custom-Built”, “Product”, “Commodity”).  
- Y-axis: From “User-Facing / Value Delivery” (top) → “Enabling / Platform” (bottom).

## Component Roles

| Component | Responsibility |
|------------|----------------|
| **CanvasArea.tsx** | Render nodes and relationships via React Flow |
| **InspectorPanel.tsx** | Display metadata for selected context |
| **RepoSidebar.tsx** | Manage and assign repositories |
| **TopBar.tsx** | Global controls and view toggle |
| **App.tsx** | Layout composition and responsive sizing |

## Aesthetic Guidelines

- Neutral tone (white, gray, muted blue).
- Rounded corners, soft shadows, generous spacing.
- Typography: system sans-serif (SF Pro / Inter).
- No bright accent colors — highlight meaning through shape and line weight.
- lucide-react icons for consistency.
- Subtle transitions (Framer Motion) for node movement and mode switch.
- Light and dark mode supported via Tailwind’s `dark:` classes.

## Persistence and Behavior

- Local-first persistence; Miro-style autosave.  
- Undo/redo history per project session.  
- No YAML or manual exports in MVP.  
- Future features may include export/import via JSON and collaborative editing.

## Accessibility and Usability

- Sufficient contrast for all text and borders.
- Visual indicators (border highlight) for selected elements.
- All controls accessible via keyboard.
- Descriptive tooltips for relationships and context labels.
- Avoid visual clutter; prioritize information density balance.

## 🔮 Future UX Enhancements

- Editable context names and relationships via inline UI.
- Filtering and highlighting by team, ownership, or relationship type.
- Zoom-to-fit, alignment guides, and auto-layout options.
- Context-level comments and annotations.
