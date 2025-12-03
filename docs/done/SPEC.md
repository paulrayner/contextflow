# Specification

## Goal
Define what the MVP of ContextFlow must do, and the constraints it must respect.
This is the behavioral contract.

---

## Core concepts users can create/edit

### Bounded Contexts
Fields:
- `name`
- `purpose` (what it does for the business / clinician / platform / etc.)
- `strategicClassification`: `core`, `supporting`, `generic`
  - Drives fill color (gold / blue / gray)
- `boundaryIntegrity`: `strong`, `moderate`, `weak`
  - Drives border style (solid thick / solid / dashed)
  - `boundaryNotes` (why strong or weak)
- `codeSize.bucket`: `tiny`, `small`, `medium`, `large`, `huge`
  - Drives bubble size (user-assigned in MVP; future: auto-calculated from LOC)
- `isLegacy` (boolean)
  - Shows ⚠ Legacy badge
- `isExternal` (boolean)
  - Marks this as an upstream/downstream context not owned by the organization (e.g. OncoKB, Genome Nexus, “External Research Consumers”)
  - External contexts should not accept repos
- `notes` (freeform): assumptions, politics, bottlenecks, "this is guessed," etc.
- Positioning:
  - `positions.flow.x`
  - `positions.strategic.x`
  - `positions.shared.y`
- `evolutionStage`: `"genesis" | "custom-built" | "product/rental" | "commodity/utility"`
  - Optional metadata that aligns with the horizontal Strategic View position where the user has placed the context

### Relationships between bounded contexts
- Direction is always meaningful and points to the upstream context (the one with more power / defines the model)
  - **Upstream** = owns the integration contract/schema; if they change their API/model, downstream must adapt
  - **Downstream** = must adapt to upstream changes; uses ACL to protect itself or conforms to upstream model
  - Examples:
    - Legacy system providing data → Core domain with ACL: Arrow points TO legacy (legacy is upstream, owns the schema)
    - Core domain publishing OHS API → External consumer: Arrow points TO core (core is upstream authority)
    - Analytics context → Multiple source contexts: Arrow points TO sources (sources are upstream, analytics conforms)
- `pattern` from a fixed vocabulary:
  - `customer-supplier`
  - `conformist`
  - `anti-corruption-layer`
  - `open-host-service`
  - `published-language`
  - `shared-kernel`
  - `partnership`
  - `separate-ways`
- Optional metadata:
  - `communicationMode` (e.g. `"REST API via backend proxy"`, `"import pipeline"`, `"manual curation"`)
  - `description`
- Rendering:
  - Most patterns: curved arrow toward upstream
  - `shared-kernel` / `partnership`: symmetric edge, not a dominating arrow

### Repos
- `name`
- `remoteUrl` (clickable in the UI)
- Assigned bounded context (`contextId`) via drag/drop
- One or more responsible teams (`teamIds`)
- Contributors (list of `Person` references, manually entered in MVP)
- Optional `analysisSummary` (future integration point)

### Teams
- `name`
- Optional `jiraBoard`
  - If it looks like a URL, render it clickable (`target="_blank"`)
- Optional `topologyType`:
  - `stream-aligned`, `platform`, `enabling`, `complicated-subsystem`, `unknown`

### People
- `displayName`
- `emails` (array)
- Can be listed as contributors to repos
- We are NOT modeling reporting lines/org charts in MVP

### Groups (capability clusters)
- User-defined clusters of multiple bounded contexts
- Rendered as organic, blob-like shapes with smooth curves wrapping naturally around member contexts
  - Algorithm: convex hull of padded context positions + Catmull-Rom curve smoothing
  - Visual style: translucent fill, minimal/subtle stroke, flowing organic boundaries
  - Matches aesthetic of canonical Wardley Maps (see `docs/strategic/LWM.png`, `docs/strategic/microsoft-fabric-wardley-map-full.png`)
- Blob shape dynamically recomputes when:
  - Member contexts are moved (drag)
  - View switches between Flow and Strategic (different X positions)
  - Contexts are added/removed from group
- Overlap allowed (multiple blobs can cover the same canvas area)
- Fields:
  - `label` (e.g. `"Data Platform / Ingestion"`)
  - `notes`
  - `color` (pastel/translucent tint)
  - `contextIds` (members)
- Deleting a group does not delete the contexts
- Opacity control: adjustable slider in TopBar affects all groups uniformly

### Actors (Wardley map users)
- Represents users of the map itself in Strategic View (e.g. "Clinical Researchers", "Data Scientists")
- Positioned at top of Strategic View, above user needs
- Horizontal position only (along evolution axis)
- Fields:
  - `name`
  - `description`
  - `position` (0-100 along evolution axis)
- Connect to User Needs via ActorNeedConnection

### User Needs (problem space)
- Represents user/customer needs in Strategic View (canonical Wardley position)
- Sits between Actors (top) and Contexts (bottom) in the value chain
- Distinguishes problem space (needs) from solution space (contexts)
- Positioned horizontally along evolution axis, fixed vertical position below actors
- Fields:
  - `name` (e.g. "Secure patient data access", "Real-time mutation analysis")
  - `description`
  - `visibility` (boolean, can be hidden without deleting)
- Connections:
  - Receives connections from Actors (who has this need)
  - Sends connections to Contexts (which components fulfill this need)
- Connection chain: Actor → User Need → Context

### Connection Highlighting Behavior
When selecting elements in Strategic View:
- **Actor selected**: Highlight connected user needs + contexts those needs depend on (2-hop chain)
- **User Need selected**: Highlight connected actors (upstream) + connected contexts (downstream)
- **Context selected**: Highlight connected user needs + actors connected to those needs (2-hop chain)
- **Relationship edge selected**: Highlight only the two connected contexts (existing DDD relationship behavior)

---

## Two views of the same world

### Flow View (default)
- X axis: value-stream order, left → right
  - e.g. Data Ingestion → Curation → Query/Analysis → Clinical Insight Delivery
  - Editable stage markers along this axis (`project.viewConfig.flowStages`)
- Y axis: value chain proximity
  - Top = user-facing / clinician-facing
  - Bottom = enabling/platform/internal capability
- Use `positions.flow.x` for horizontal and `positions.shared.y` for vertical

### Strategic View
- X axis: Wardley-style evolution / commoditization
  - “Genesis / Custom-built / Product-Rental / Commodity-Utility”
- Y axis: same value-chain proximity (same as Flow View)
- Use `positions.strategic.x` for horizontal and `positions.shared.y` for vertical

### Movement rules
- Dragging horizontally in Flow View updates `positions.flow.x`
- Dragging horizontally in Strategic View updates `positions.strategic.x`
- Dragging vertically in either view updates `positions.shared.y`
- When switching views, nodes animate sliding horizontally between their Flow vs Strategic X positions; vertical stays fixed

---

## Canvas behavior and UI requirements
- Always-visible axes for the active view
  - Flow View shows named flow stages (editable)
  - Strategic View shows Wardley-style evolution bands (fixed labels)
- Pan and zoom on the canvas
  - Click-drag background to pan
  - Scroll/pinch to zoom
- Fit-to-map control to center/scale all contexts
- Add Context button
- Add Relationship by dragging from one context to another, then choosing the relationship pattern
- Edge rendering:
  - Curved edges
  - Minimal obstacle avoidance (edges try not to run straight through nodes)
- External bounded contexts (`isExternal`) render with a visible external indicator
  - e.g. dotted ring and/or an “External” pill badge
  - Repos cannot be assigned to them
- Legacy contexts (`isLegacy`) render with a ⚠ Legacy badge
- Weak boundaries (`boundaryIntegrity: "weak"`) render with porous/dashed borders

---

## Side panels and overlays
### Left sidebar (RepoSidebar)
- Shows repos that have no `contextId` (“Unassigned Repos”)
- Each repo shows:
  - `name`
  - `remoteUrl` (clickable if present)
  - team chips
- You can drag a repo card onto a bounded context node in the canvas

### Right inspector panel (InspectorPanel)
Context selected:
- Edit fields:
  - name
  - purpose
  - strategicClassification
  - boundaryIntegrity + boundaryNotes
  - codeSize.bucket
  - isLegacy
  - isExternal
  - evolutionStage (optional)
  - notes
- Show repos mapped to that context:
  - Name
  - Clickable repo link (`remoteUrl`)
  - Team chips
    - Hover/click a chip → show team details:
      - name
      - topologyType
      - jiraBoard (clickable if URL)
  - Contributors (people display names)
- Show relationships that touch this context:
  - Upstream and downstream partners
  - Pattern label (customer-supplier, conformist, etc.)

Relationship selected:
- Edit:
  - pattern
  - communicationMode
  - description
- Delete relationship

Group selected:
- Edit:
  - label
  - color tint
  - notes
- Add/remove member contexts
- Delete group

### Overlays
- RelationshipCreateOverlay
  - Shown when you drag from one context to another
  - Lets you select the relationship type (customer-supplier, conformist, etc.)
  - Lets you add optional communicationMode / description
- GroupCreateOverlay
  - Shown after multi-select
  - Lets you create a named translucent hull group

---

## Persistence / project handling
- The “board” is a `Project`
- Autosave the active Project locally (browser localStorage or IndexedDB) after each change
- Support:
  - Import Project (load `project.json`)
  - Export Project (download `project.json`)
- Support multiple locally saved projects
  - On startup, show a list of saved projects and let the user pick (Miro-style recent boards)
- No server/network dependency in MVP

---

## Undo / redo
- Undo/redo applies to **structural canvas actions only**:
  - Add/move/delete context
  - Add/delete relationship
  - Assign/unassign repo to a context
  - Create/delete group
- Undo/redo does **not** apply to text edits in side panels (notes, boundaryNotes, etc.). Those autosave directly.

---

## Non-goals for MVP
- No multi-user real-time collaboration
- No org charts / reporting lines
- No automatic team topology inference rendered on canvas
- No GitHub API or live network access baked into production path
- No analytics or heuristics beyond user-provided notes / analysisSummary
