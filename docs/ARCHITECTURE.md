# Architecture

## Overview
ContextFlow is a browser-based React application for mapping bounded contexts, their strategic relationships, and their code ownership.
It presents two synchronized projections of the same model: Flow View and Strategic View.

The core of the app is:
- A canvas (React Flow) that renders nodes/edges/groups and allows drag interactions
- Side panels for details and editing
- Import/export/autosave around a single `Project` data structure

This document defines how we build it.

---

## Tech stack decisions
- Language: TypeScript
- UI framework: React
- Runtime/build: Vite (simple local dev, runs in browser)
- Styling: Tailwind CSS
- UI primitives: shadcn/ui (Radix-based, accessible, modern aesthetic)
- Icons: lucide-react
- Canvas / graph rendering: React Flow
  - Handles pan/zoom, nodes, edges, selection
- Animation: Framer Motion
  - Smoothly animate node horizontal position when switching Flow ↔ Strategic views
- State: Zustand store for editor state
- Persistence: localStorage (Milestone 1), IndexedDB (Milestone 2) for autosave, plus explicit JSON import/export
- No backend service in MVP

---

## Data model

```ts
export interface Project {
  id: string;
  name: string;

  contexts: BoundedContext[];
  relationships: Relationship[];
  repos: Repo[];
  people: Person[];
  teams: Team[];
  groups: Group[];

  viewConfig: {
    flowStages: FlowStageMarker[];
  };
}

export interface BoundedContext {
  id: string;
  name: string;
  purpose?: string;

  strategicClassification?: 'core' | 'supporting' | 'generic';

  boundaryIntegrity?: 'strong' | 'moderate' | 'weak';
  boundaryNotes?: string;

  positions: {
    strategic: { x: number }; // Strategic View horizontal (0..100)
    flow: { x: number };      // Flow View horizontal (0..100)
    shared: { y: number };    // vertical (0..100), shared across views
  };

  evolutionStage?: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility'; // aligns with Strategic View horizontal position

  codeSize?: {
    loc?: number;
    bucket?: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  };

  isLegacy?: boolean;
  isExternal?: boolean; // true for upstream data sources, downstream consumers, etc.

  notes?: string; // analysis, assumptions, bottlenecks, risks
}

export interface Relationship {
  id: string;

  // Arrow points to upstream (the one with more power / defines language)
  fromContextId: string; // downstream / dependent
  toContextId: string;   // upstream / authority

  pattern:
    | 'customer-supplier'
    | 'conformist'
    | 'anti-corruption-layer'
    | 'open-host-service'
    | 'published-language'
    | 'shared-kernel'
    | 'partnership'
    | 'separate-ways';

  communicationMode?: string;
  description?: string;
}

export interface Repo {
  id: string;
  name: string;
  remoteUrl?: string; // clickable in UI

  contextId?: string;    // which bounded context this repo supports
  teamIds: string[];     // which teams own prod responsibility

  contributors: ContributorRef[];

  analysisSummary?: string; // optional future analysis output
}

export interface ContributorRef {
  personId: string;
}

export interface Person {
  id: string;
  displayName: string;
  emails: string[];
  teamIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  jiraBoard?: string; // clickable if looks like URL
  topologyType?: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown';
}

export interface Group {
  id: string;
  label: string;        // e.g. "Data Platform / Ingestion"
  color?: string;       // translucent tint for hull
  contextIds: string[]; // members
  notes?: string;
}

export interface FlowStageMarker {
  label: string;    // e.g. "Data Ingestion"
  position: number; // 0..100 along Flow View X axis
}
```

### Semantics to respect
- `strategicClassification` → bubble fill color
  - core → soft gold
  - supporting → pale blue
  - generic → light gray
- `boundaryIntegrity` → border style
  - strong → thick solid
  - moderate → medium solid
  - weak → dashed / porous
- `codeSize.bucket` → node radius (`tiny`..`huge` → progressively larger)
- `isLegacy` → show a ⚠ Legacy badge in the corner of the node
- `isExternal` → show an “External” badge and/or dotted outer ring, and disallow repo assignment
- `positions` drives layout:
  - Flow View uses `positions.flow.x` (horizontal) and `positions.shared.y` (vertical)
  - Strategic View uses `positions.strategic.x` (horizontal) and `positions.shared.y` (vertical)
- `relationships` arrow direction:
  - arrow points toward `toContextId` (upstream power)
  - `shared-kernel` / `partnership` should render as symmetric (no dominant arrowhead)

---

## Component layout

```txt
<App />
  <ProjectPicker />            // Choose/create project from local storage
  <EditorView />               // Active board
    <TopBar />                 // view toggle, add context, fit-to-map, undo/redo, import/export
    <MainLayout />
      <RepoSidebar />          // Unassigned repos; drag to assign to a context
      <CanvasArea />           // React Flow canvas:
                               //   contexts, relationships, groups, axes
      <InspectorPanel />       // Edit selected context / relationship / group
    <RelationshipCreateOverlay /> // When creating new relationship by drag
    <GroupCreateOverlay />        // When creating a new group from multi-select
```

### `<TopBar />`
- Toggle `Flow View` / `Strategic View`
- Add Context
- Fit to Map
- Undo / Redo
- Import Project / Export Project
- Show active project name

### `<CanvasArea />`
- Renders nodes (bounded contexts)
  - fill color = `strategicClassification`
  - border style = `boundaryIntegrity`
  - badge if `isLegacy`
  - badge/dotted ring if `isExternal`
  - radius = `codeSize.bucket`
- Renders edges (relationships)
  - curved bezier lines
  - arrowhead points to upstream (`toContextId`)
  - symmetric styling for `shared-kernel` / `partnership`
  - light obstacle avoidance so lines don't run straight through other nodes
- Renders groups
  - compute a convex hull (or padded bounding polygon) around all member contexts
  - draw a translucent blob with the group's label
  - allow overlapping hulls (multiple groups can cover the same canvas area)
- Renders axes
  - Flow View:
    - X axis = `project.viewConfig.flowStages`
    - Y axis label (top “user-facing / clinician-facing”, bottom “enabling / platform”)
  - Strategic View:
    - X axis = Wardley bands (“Genesis / Custom-built / Product-Rental / Commodity / Utility”)
    - Y axis is unchanged
- Drag behavior
  - In Flow View:
    - horizontal drag → update `positions.flow.x`
    - vertical drag → update `positions.shared.y`
  - In Strategic View:
    - horizontal drag → update `positions.strategic.x`
    - vertical drag → update `positions.shared.y`
- View switching
  - Uses Framer Motion to animate each node’s horizontal position from Flow to Strategic (or back)

### `<RepoSidebar />`
- Shows repos with no `contextId` (unassigned)
- Shows `name`, `remoteUrl` (as clickable if present), team chips
- Supports dragging a repo card onto a context bubble in `<CanvasArea />`
  - Drop assigns `repo.contextId`

### `<InspectorPanel />`
When a context is selected:
- Editable fields:
  - name
  - purpose
  - strategicClassification
  - boundaryIntegrity + boundaryNotes
  - codeSize.bucket
  - isLegacy
  - isExternal
  - evolutionStage (optional)
  - notes
- Repos assigned to this context:
  - show repo name (and clickable `remoteUrl`)
  - show team chips
    - hover/click team chip → show team details:
      - name
      - topologyType
      - jiraBoard (if looks like URL, clickable)
  - show contributors (people displayName)
- Relationships:
  - list upstream/downstream neighbors
  - label with DDD pattern (“conformist”, “customer-supplier”, etc.)

When a relationship is selected:
- pattern
- communicationMode
- description
- delete action

When a group is selected:
- label, tint color, notes
- add/remove contexts
- delete group

### `<RelationshipCreateOverlay />`
- Triggered by dragging from one context to another
- Choose pattern from allowed vocabulary
- Optional `communicationMode`
- Optional `description`
- Confirm → creates `Relationship`

### `<GroupCreateOverlay />`
- Triggered by multi-select
- Enter `label`, `notes`, `color`
- Confirm → creates `Group` and draws translucent hull

---

## Editor/global state

We maintain a Zustand store shaped like:

```ts
export type ViewMode = 'flow' | 'strategic';

interface EditorCommand {
  type: string;
  payload: any;
}

interface EditorState {
  activeProjectId: string | null;
  projects: Record<string, Project>;

  activeViewMode: ViewMode;

  selectedContextId: string | null;
  selectedRelationshipId: string | null;
  selectedGroupId: string | null;

  canvasView: {
    flow: { zoom: number; panX: number; panY: number };
    strategic: { zoom: number; panX: number; panY: number };
  };

  undoStack: EditorCommand[];
  redoStack: EditorCommand[];
}
```

Undo/redo applies to structural actions only:
- add/move/delete context
- add/delete relationship
- assign/unassign repo
- create/delete group

Text edits in the InspectorPanel (notes, boundaryNotes, etc.) are *not* undoable; they autosave directly.

---

## Persistence
- After each state mutation, we serialize the active `Project` and store it locally
  - Milestone 1: localStorage
  - Milestone 2: migrate to IndexedDB for better performance with larger projects
- We maintain a list of recently opened projects
- On startup, `<ProjectPicker />` lists those projects (Miro-style "recent boards")
- Export → download current `Project` as `project.json`
- Import → upload `project.json`, add to store, select it

---

## Visual rules summary
- Fill color:
  - `core` → soft gold
  - `supporting` → pale blue
  - `generic` → light gray
- Border style:
  - `strong` → thick solid
  - `moderate` → medium solid
  - `weak` → dashed / porous
- Legacy:
  - ⚠ badge in corner of node
- External:
  - Small “External” badge and/or dotted ring
  - Cannot assign repos to this node
- Group hulls:
  - Translucent pastel blobs with label text
  - Groups can overlap

These rules are what devs and AI must follow when rendering.
