# PLAN.md

## Purpose
This is the implementation roadmap for ContextFlow.
Each milestone is designed to produce something demoable and valuable on its own, and each step lines up with how we'll hand work to an AI pair (Claude Code) or a human dev.

We will use `examples/cbioportal.project.json` as our demo fixture. That file encodes:
- Realistic bounded contexts (Portal UI, Backend/API, Session Service, Validator/Import Pipeline, Clinical/Genomic Store, etc.)
- External contexts (OncoKB, Genome Nexus, CIVIC / variant knowledge bases, External Research Consumers)
- Relationships using DDD strategic patterns (customer-supplier, conformist, open-host-service, shared-kernel)
- Repos with clickable `remoteUrl`
- Teams with Jira boards
- Groups for "Research Insights Surface" and "Data Platform / Ingestion"
- Flow View stages for Data Ingestion → Curation → Analysis → Clinical Insight Delivery
- Positions for both Flow View and Strategic View

---

## Milestone 1: Flow View core

### Goal
Render a believable Flow View map from `cbioportal.project.json`.

### Deliverables
- Hardcode-load `cbioportal.project.json` at startup (or choose it from a basic ProjectPicker).
- Implement `<CanvasArea />` using React Flow.
- Render all `contexts` as bubbles positioned with:
  - x = `positions.flow.x`
  - y = `positions.shared.y`
- Style bubbles:
  - Fill color from `strategicClassification`:
    - core → soft gold
    - supporting → pale blue
    - generic → light gray
  - Border style from `boundaryIntegrity`:
    - strong → thick solid
    - moderate → medium solid
    - weak → dashed / porous
  - Bubble radius from `codeSize.bucket` (`tiny`..`huge`)
  - ⚠ badge if `isLegacy`
  - “External” badge / dotted ring if `isExternal`
- Render curved edges for `relationships`:
  - Arrow points to `toContextId` (upstream)
  - `shared-kernel` / `partnership` should render symmetric (no dominant arrowhead)
- Render Flow View X-axis stages using `project.viewConfig.flowStages`
  - Example: “Data Ingestion”, “Cohort Query / Analysis”, “Clinical Insight Delivery”
- Render Y-axis labels (top = user-facing / clinician-facing, bottom = enabling/platform)
- Implement node selection:
  - Clicking a node highlights it and stores `selectedContextId`
- Implement `<InspectorPanel />` basic (right side):
  - When a context is selected, show read-only info (name, purpose, notes)
- Implement pan, zoom, and Fit to Map
- Implement Export Project as `project.json`
- Implement autosave (serialize current Project to localStorage on edit)

### Result
At the end of Milestone 1 you can:
- Show a real cbioportal map in Flow View
- Click a context and talk about it
- Export the project file
This is already demoable in front of stakeholders.

---

## Milestone 2: Editing + Strategic View

### Goal
Turn the visualization into an editable tool and introduce Strategic View.

### Deliverables
- Allow editing context fields in InspectorPanel:
  - name
  - purpose
  - strategicClassification
  - boundaryIntegrity + boundaryNotes
  - codeSize.bucket
  - isLegacy
  - isExternal
  - evolutionStage (optional)
  - notes
- Allow dragging nodes:
  - Horizontal drag updates `positions.flow.x` (in Flow View)
  - Vertical drag updates `positions.shared.y`
- Add `<TopBar />` with:
  - Toggle `Flow View` / `Strategic View`
  - Add Context
  - Fit to Map
  - Undo / Redo
  - Import Project / Export Project
  - Project name display
- Implement undo/redo stack for structural actions:
  - add context
  - move context
  - delete context
- Implement Strategic View:
  - View toggle switches active mode
  - Canvas switches to using:
    - x = `positions.strategic.x`
    - y = `positions.shared.y`
  - Show Wardley-style evolution bands for Strategic View X-axis:
    - “Genesis / Custom-built / Product-Rental / Commodity/Utility”
  - Animate horizontal node repositioning between Flow and Strategic using Framer Motion
  - While Strategic View is active:
    - horizontal drag updates `positions.strategic.x`
    - vertical drag still updates `positions.shared.y`
- Show relationships in Strategic View exactly like Flow View (arrows, patterns) — semantics do not change

### Result
At the end of Milestone 2 you can:
- Switch between Flow and Strategic views live in front of stakeholders
- Change positions in either view
- Edit display-critical metadata
- Undo accidental layout edits
- Import a saved project and continue work

This is now a usable consulting asset.

---

## Milestone 3: Repos, Teams, Groups

### Goal
Tie code and ownership to the map, and add capability groupings.

### Deliverables
- Implement `<RepoSidebar />` (left column):
  - Show repos with no `contextId` (“Unassigned Repos”)
  - Each repo card shows:
    - repo `name`
    - clickable `remoteUrl` if available
    - team chips (teams responsible for prod changes)
  - Support dragging a repo card from `<RepoSidebar />` onto a context bubble in `<CanvasArea />`.
    - On drop: set that repo’s `contextId` to that context’s id
    - Push this change to undo stack
- In `<InspectorPanel />`, for a selected context:
  - Show repos that have `repo.contextId === thisContext.id`
  - Each repo entry shows:
    - repo name (clickable if `remoteUrl` is URL-like)
    - responsible team chips
      - hover/click a team chip → show team details:
        - name
        - topologyType (stream-aligned / platform / etc.)
        - jiraBoard (clickable if URL-like)
    - contributors (person displayName list)
- Add ability to create/edit Teams in the InspectorPanel
  - name
  - jiraBoard
  - topologyType
- Add Groups:
  - Multi-select contexts on canvas (Shift+click or marquee)
  - “Create Group” triggers `<GroupCreateOverlay />`
    - label (“Data Platform / Ingestion”)
    - optional notes
    - optional tint color
  - Render group as translucent hull behind those member contexts
  - Selecting a group opens it in InspectorPanel for editing/removal/deletion
- Add undo/redo support for:
  - assign/unassign repo to context
  - create/delete group

### Result
At the end of Milestone 3 you can:
- Assign repos to bounded contexts
- Show which teams are responsible and link to their Jira board
- See capability groupings (platform cluster, insights surface cluster)
- Show upstream external services and downstream consumers clearly
- Tell a story about strategic dependency, delivery flow, ownership, and boundary health in one tool

That is the MVP we ship as open source.
