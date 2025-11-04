# Plan

## Purpose
This is the implementation roadmap for ContextFlow.
Each milestone is designed to produce something demoable and valuable on its own, and each step lines up with how we'll hand work to an AI pair (Claude Code) or a human dev.

We will use `examples/sample.project.json` as our demo fixture. That file encodes:
- Realistic bounded contexts (Storefront, Product Catalog, Shopping Cart, Checkout, Payment, Order Management, Warehouse, etc.)
- External contexts (Stripe Payment Gateway, Tax Service, Shipping Carriers, Fraud Detection)
- Relationships using DDD strategic patterns (customer-supplier, conformist, anti-corruption-layer, open-host-service, published-language, shared-kernel, partnership)
- Repos with clickable `remoteUrl`
- Teams with Jira boards
- Groups for "Customer-Facing Services", "Platform Services", "Security & Compliance", etc.
- Flow View stages for Discovery → Selection → Purchase → Fulfillment → Post-Sale
- Positions for both Flow View and Strategic View

---

## Completed Milestones

The following milestones have been fully implemented and shipped:

### ✅ Milestone 1: Flow View core (v0.1.0 - Oct 30, 2025)
- All deliverables completed
- Flow View canvas with dual-axis visualization
- Visual bounded context nodes with strategic classification colors
- DDD relationship edges with pattern labels
- Inspector panel with read-only context details
- Verified: `185e9ed feat: complete Milestone 1 - Flow View foundation`

### ✅ Milestone 2: Editing + Strategic View (v0.2.0 - Oct 30, 2025)
- All deliverables completed
- Strategic View with Wardley evolution bands
- Animated view transitions using Framer Motion
- Full context editing in Inspector Panel
- Context creation and deletion
- Node dragging with position updates
- Undo/Redo for structural actions
- IndexedDB persistence
- Project import/export
- Dark mode toggle
- Verified: `c08d016 feat: complete Milestone 2 - editing and Strategic View`

### ✅ Milestone 3: Repos, Teams, Groups (v0.3.0 - Nov 1, 2025)
- All deliverables completed
- RepoSidebar with drag-drop assignment
- Multi-select and group drag
- RelationshipCreateDialog with all DDD patterns
- Groups rendered as translucent hulls
- Team management with topology types
- Undo/redo for repos, relationships, groups
- CodeCohesion API integration for live repo stats
- Multi-project support
- Verified: `c258de8 feat: implement Milestone 3 - Repos, Teams, and Groups`

### Beyond MVP Features (v0.4.0+)

The following features were implemented beyond the original 3-milestone plan:

**Temporal Evolution (v0.4.0)**
- Time-based visualization in Strategic View
- Keyframe creation and management at specific dates
- Timeline slider with playback animation
- Position interpolation between keyframes
- Context fade in/out for appearing/disappearing contexts
- See: `docs/strategic/PLAN.md` for detailed spec

**Distillation View**
- Nick Tune's Core Domain Chart visualization
- Business Differentiation vs Model Complexity axes
- Strategic classification derived from quadrant position

**Actors (Wardley Map Users)**
- Actor nodes at top of Strategic View
- Actor-to-context connections
- Actor management in InspectorPanel

**UI/UX Enhancements**
- Dynamic edge routing for shortest path connections
- Filter toggles for groups and relationships visibility
- Adjustable group opacity
- Highlight connected contexts when selecting relationships
- Collapsible repo info with expandable stats

---

## Original Milestone Specifications

(Preserved for historical reference)

---

## Milestone 1: Flow View core

### Goal
Render a believable Flow View map from `sample.project.json`.

### Deliverables
- Hardcode-load `sample.project.json` at startup (or load it from a basic ProjectPicker).
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
  - Example: "Discovery", "Selection", "Purchase", "Fulfillment", "Post-Sale"
- Render Y-axis labels (top = user-facing / clinician-facing, bottom = enabling/platform)
- Implement node selection:
  - Clicking a node highlights it and stores `selectedContextId`
- Implement `<InspectorPanel />` basic (right side):
  - When a context is selected, show read-only info (name, purpose, notes, repos, teams)
- Implement pan, zoom, and Fit to Map
- Load `sample.project.json` at startup (hardcoded or from localStorage cache)

### Result
At the end of Milestone 1 you can:
- Show a real e-commerce platform map in Flow View
- Click a context and inspect its details (including repos and teams)
- Navigate and explore the visualization
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
  - Import / Export Project (JSON file upload/download)
  - Project name display
- Migrate persistence from localStorage to IndexedDB for better performance
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
- Add multi-select and group move:
  - Multi-select contexts with Shift/Cmd/Ctrl + click (already implemented)
  - Visual highlight for all selected contexts (selection border)
  - Dragging any selected context moves the entire selection as a group
  - Maintain relative positions between contexts during group move
  - Groups automatically adjust to follow their member contexts
  - Record group move as single undo/redo action
  - Multi-selection does not affect InspectorPanel (remains on single selected context or group)
  - Click canvas to deselect all
- Add Relationships:
  - Add "Add Relationship" button in InspectorPanel when a context is selected
  - Trigger `<RelationshipCreateDialog />`:
    - Select target context (dropdown or canvas click)
    - Select DDD pattern (customer-supplier, conformist, anti-corruption-layer, open-host-service, published-language, shared-kernel, partnership, separate-ways)
    - Optional notes
  - Render relationship as edge on canvas with pattern label on hover
  - Allow deleting relationships from InspectorPanel
- Add Groups:
  - Multi-select contexts on canvas (Shift+click or marquee)
  - "Create Group" triggers `<GroupCreateOverlay />`
    - label ("Data Platform / Ingestion")
    - optional notes
    - optional tint color
  - Render group as translucent hull behind those member contexts
  - Selecting a group opens it in InspectorPanel for editing/removal/deletion
- Add undo/redo support for:
  - assign/unassign repo to context
  - add/delete relationship
  - create/delete group

### Result
At the end of Milestone 3 you can:
- Assign repos to bounded contexts
- Show which teams are responsible and link to their Jira board
- See capability groupings (platform cluster, insights surface cluster)
- Show upstream external services and downstream consumers clearly
- Tell a story about strategic dependency, delivery flow, ownership, and boundary health in one tool

That is the MVP we ship as open source.

---

## Milestone 4: SPEC Compliance & Wardley Map Refinement

### Goal
Complete the missing SPEC.md requirements and improve Strategic View's fidelity to canonical Wardley mapping practices.

### Deliverables

**Editable Flow Stage Markers:**
- Add UI to edit Flow View stage markers (currently read-only)
- Allow users to:
  - Click stage label to edit text inline (autosave on blur, one undo action per edit)
  - Drag stage label left/right to reposition along Flow View X-axis (horizontal only)
  - Add new stages with "Add Stage" button in TopBar (only visible in Flow View)
    - Creates stage at next available position (evenly distributed between existing stages)
    - User can then drag to desired position and click to rename
  - Delete stages via right-click context menu on stage label (with confirmation)
- Validation rules:
  - Stage positions must be unique (no two stages at same X position)
  - Stage labels must be unique
  - No constraints on proximity between stages
- Implement store actions:
  - `updateFlowStage(index, updates)` to modify label/position
  - `addFlowStage(label, position)` to create new stage
  - `deleteFlowStage(index)` to remove stage
- Add undo/redo support for stage repositioning and add/delete (text edits autosave, not undoable)
- Persist changes to `project.viewConfig.flowStages`

**Relationship Editing:**
- Add ability to edit relationships after creation (currently can only delete)
- Make relationship edges clickable on canvas to select them:
  - Click edge → selects relationship (distinguished from hover highlight)
  - Shows selection state visually (e.g., thicker line, different color)
  - Opens relationship in InspectorPanel
- When relationship is selected in InspectorPanel, show editable fields:
  - Pattern (dropdown with all 8 DDD patterns)
  - Communication Mode (text input)
  - Description (textarea)
- Implement `updateRelationship(relationshipId, updates)` action in store
- Text edits autosave on blur (not undoable, follows existing pattern)
- Pattern changes are undoable actions
- Real-time edge label updates when pattern changes

**Group Membership Management:**
- Add ability to add existing contexts to a group (can currently only remove or create from multi-select)
- Two methods for adding contexts to groups:
  1. Multi-select contexts on canvas → "Add to Group" in floating action panel → select target group
  2. Select group → InspectorPanel shows "Add Contexts" with multi-select or individual add
- Implement `addContextToGroup(groupId, contextId)` action in store
- Support batch add: `addContextsToGroup(groupId, contextIds[])`
- Add undo/redo support for adding contexts to groups (batch add is single undo action)
- Group hull automatically expands to encompass new members

### Result
At the end of Milestone 4:
- All SPEC.md behavioral requirements are fully implemented
- Users have full editorial control over stage markers, relationships, and group membership
- Complete undo/redo coverage for all editing operations
- Tool achieves full compliance with the behavioral contract defined in SPEC.md

---

## Milestone 5: Wardley Map User Needs & Value Chain

### Goal
Improve Strategic View's fidelity to canonical Wardley mapping by adding the user needs layer and value chain visualization.

### Deliverables

**User Needs at Top of Map:**
- Add user needs at top of Strategic View (canonical Wardley position)
- Distinguish problem space (user needs) from solution space (contexts/components)
- Position user needs above the evolution axis as anchor points

**User Needs as First-Class Entities:**
- Support adding/editing/deleting user needs with undo/redo
- Store user needs separately from actors (different semantics: user needs vs. map users)
- User need properties:
  - `name` (e.g., "Secure patient data access")
  - `description` (optional)
  - Visibility flag (shown/hidden)
- InspectorPanel support for editing user needs

**Value Chain Visualization:**
- Add visual anchor lines showing value chain from user needs down to components
- Connect user needs to the contexts/components they depend on
- Support creating/deleting need-to-context connections
- Visual styling:
  - Dotted or dashed lines from needs to contexts
  - Different color/style from DDD relationship edges
  - Shows dependency flow from problem space to solution space

**Value Chain Positioning:**
- User needs positioned only horizontally (along evolution axis)
- Vertical position fixed at top of Strategic View canvas
- Drag to adjust horizontal position (evolution stage)
- Visual Y-axis label clarification: "User Needs" at top, "Value Delivery" below

### Result
At the end of Milestone 5:
- Strategic View accurately represents canonical Wardley mapping structure
- Clear distinction between problem space (user needs) and solution space (components)
- Value chain visualization shows how contexts serve user needs
- Full Wardley Map compliance: user needs → components → evolution → dependency flow
