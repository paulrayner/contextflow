# SPEC.md

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
  - Drives bubble size
- `isLegacy` (boolean)
  - Shows ⚠ Legacy badge
- `isExternal` (boolean)
  - Marks this as an upstream/downstream context not owned by the organization (e.g. OncoKB, Genome Nexus, “External Research Consumers”)
  - External contexts should not accept repos
- `notes` (freeform): assumptions, politics, bottlenecks, “this is guessed,” etc.
- Positioning:
  - `positions.flow.x`
  - `positions.strategic.x`
  - `positions.shared.y`
- Optional storytelling:
  - `evolutionStage`: `"genesis" | "custom-built" | "product/rental" | "commodity/utility"`

### Relationships between bounded contexts
- Direction is always meaningful and points to the upstream context (the one with more power / defines the model)
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
- Rendered as a translucent, padded hull around those contexts
- Overlap allowed
- Fields:
  - `label` (e.g. `"Data Platform / Ingestion"`)
  - `notes`
  - `color` (pastel/translucent tint)
  - `contextIds` (members)
- Deleting a group does not delete the contexts

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
