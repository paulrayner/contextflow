# TODO

## High Priority

**Missing SPEC.md Requirements:**
- [ ] Add ability to edit Flow View stage markers (SPEC.md says "editable stage markers" but current implementation is read-only)
  - Add UI to rename stage labels
  - Add UI to adjust stage positions
  - Add UI to add/delete stages
  - Store in [src/model/store.ts](src/model/store.ts) with undo/redo support
- [ ] Add ability to edit relationships after creation (currently can only delete, not edit pattern/communicationMode/description)
  - Implement `updateRelationship` action in [src/model/store.ts](src/model/store.ts)
  - Add edit UI when relationship is selected in [src/components/InspectorPanel.tsx](src/components/InspectorPanel.tsx)
  - Support undo/redo for relationship edits
- [ ] Add ability to add existing contexts to a group (currently can only remove, or create group from multi-select)
  - Implement `addContextToGroup` action in [src/model/store.ts](src/model/store.ts)
  - Add "Add to Group" dropdown in [src/components/InspectorPanel.tsx](src/components/InspectorPanel.tsx) when context is selected
  - Support undo/redo for adding to group

## Backlog

**Strategic View Enhancements:**
- [ ] Add user needs and problem/solution space distinction to Wardley map in strategic view
- [ ] Improve Wardley map compliance (currently missing some canonical Wardley elements)

**Team Flow:**
- [ ] Consider developing separate integrated tool for team flow (similar to CodeCohesion https://lnkd.in/grhy_XRp)
- [ ] Note: Flow view is currently more value stream than actual team flow

**Team Topologies:**
- [ ] Enhance Team Topologies implementation with more substance (currently mostly conceptual)
- [ ] Add visual team topology rendering on canvas (e.g., interaction modes between teams)

**Quality of Life:**
- [ ] Add search/filter for contexts, repos, teams
- [ ] Add keyboard shortcuts documentation overlay (Cmd/Ctrl+?)
- [ ] Add onboarding/tutorial for first-time users
- [ ] Add example projects library (beyond ACME and cBioPortal)

## Done
- [x] Milestone 1: Flow View core (v0.1.0)
- [x] Milestone 2: Editing + Strategic View (v0.2.0)
- [x] Milestone 3: Repos, Teams, Groups (v0.3.0)
- [x] Temporal Evolution (v0.4.0)
- [x] Distillation View
- [x] Actors in Strategic View
- [x] CodeCohesion API Integration
- [x] Multi-project support
- [x] Dynamic edge routing
- [x] Filter toggles for groups/relationships
