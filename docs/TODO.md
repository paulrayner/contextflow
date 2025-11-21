# TODO

## In Progress

- [ ] Add analytics (using Simple Analytics)

## Backlog

- [ ] Work through process to test UX for everything implemented so far. Review for refactoring opportunities
- [ ] Refactor store.ts following extract-and-prove pattern (see STORE_REFACTORING_PLAN.md)
- [ ] Determine when to introduce actors and user needs in flow. Problem is that Wardley mapping starts with this, but contexts already exist on Wardley map from context mapping in value stream view
- [ ] Add onboarding/tutorial for first-time users
- [ ] Accessibility checks
- [ ] Responsive design
- [ ] Add search/filter for contexts, repos, teams
- [ ] Add keyboard shortcuts documentation overlay (Cmd/Ctrl+?)
- [ ] Add about page? link to repo?

**Team Topologies:**
- [ ] Enhance Team Topologies implementation with more substance (currently mostly conceptual)
- [ ] Add visual team topology rendering on canvas (e.g., interaction modes between teams)

**Team Flow:**
- [ ] Consider developing separate integrated tool for team flow (similar to CodeCohesion https://lnkd.in/grhy_XRp)

## Done
- [x] Migrate to VirtualGenius organization and deploy to contextflow.virtualgenius.com
- [x] Organic blob-based group rendering (Milestone 6)
- [x] Set up sample empty practice project in production demo
- [x] Rename Flow view to Value Stream view
- [x] Milestone 1: Flow View core (v0.1.0)
- [x] Milestone 2: Editing + Strategic View (v0.2.0)
- [x] Milestone 3: Repos, Teams, Groups (v0.3.0)
- [x] Milestone 4: SPEC Compliance & Full Editability (v0.5.0)
  - [x] Editable Flow View stage markers (rename, reposition, add, delete)
  - [x] Relationship editing after creation (pattern, communication mode, description)
  - [x] Add existing contexts to groups with undo/redo
- [x] Milestone 5: Wardley Map User Needs & Value Chain (v0.6.0)
  - [x] Three-layer value chain structure: Actors → User Needs → Contexts
  - [x] UserNeed entities with management UI and connections
  - [x] 2-hop connection highlighting across value chain
- [x] Temporal Evolution (v0.4.0)
  - [x] Time-based visualization with keyframes
  - [x] Timeline slider with playback animation
  - [x] Context position interpolation and fade effects
- [x] Distillation View
- [x] Actors in Strategic View
- [x] CodeCohesion API Integration
- [x] Multi-project support
- [x] Dynamic edge routing
- [x] Filter toggles for groups/relationships
- [x] Highlight connected contexts when selecting relationships or actors
- [x] Collapsible repo info with live statistics
