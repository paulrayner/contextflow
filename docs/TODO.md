# TODO

## In Progress

- [x] Enable drag connections between contexts
- [x] Fix connections (make easier to find and attach connection points)

## Backlog

- [ ] Fit to map icon on canvas doesn't work properly
- [ ] Delete key on mac/firefox doesn't work (Delete something, click on it and it comes back), but Delete button does
- [ ] Add grouping of elements and bulk-move
- [ ] Add BIGGER YUGE size for context
- [ ] Add relationships between contexts by clicking rather than just the Add Relationship button (same as users/needs/contexts)
- [ ] Can't reverse context relationships
- [ ] Add explanation for each context relationship type
- [ ] Add elan working starter project, with sample stages, sample contexts already populated
- [ ] Context relationships shouldn't be INCOMING/OUTGOING, but upstream/downstream, partners, shared kernel
- [ ] Add optional actor attributes: goal(s), challenges
- [ ] How to avoid confusion between actor, need, and context?
- [ ] Add group didn't work for Leads Management. It added a group blob, but it is outside of leads managemenent!
- [ ] Not clear how to add a context to a group
- [ ] Decide on actor vs user (e.g. actor + user need, or user + user need)
- [ ] Add new project description: goal/purpose, scope, creator name? (how does this match to Wardley Mapping step 1 - Purpose?)
- [ ] When switching to distillation view, all contexts are overlapping in the middle - a little confusing
- [ ] Remove UPDATE buttons next to context strategic classification and evolution stage
- [ ] Hide context strategic classification and evolution stage values until explicity set in appropriate views
- [ ] Add onboarding/tutorial for first-time users (e.g. user needs guidelines: https://userneedsmapping.com/docs/step-3-defining-user-needs/)
- [ ] Add informational overlays/help throughout app by default (can turn off in settings). For example, what each of the evolution stages mean and their attributes (hover over the evolution stage name)
- [ ] Context boundary width should reflect boundary strength
- [ ] Check how shared kernel is represented (should probably be overlapping contexts?)
- [ ] Add teams to contexts
- [ ] Seems to be a delay on connections when dragging contexts
- [ ] Accessibility checks
- [ ] Responsive design
- [ ] Add search/filter for contexts, repos, teams
- [ ] Verify how to add/manage repos
- [ ] Add keyboard shortcuts documentation overlay (Cmd/Ctrl+?)
- [ ] Add about page? link to repo?

### Temporal Evolution Enhancements
- [ ] Temporal Milestone 2: Interpolation polish (smooth animations, snap-to-keyframe refinements)
- [ ] Temporal Milestone 3: Keyframe Management UI (keyframe list panel, context visibility per keyframe, copy keyframe)
- [ ] Temporal Milestone 4: Visualization Enhancements (trajectory overlay, animated playback, ghost preview mode, quarter granularity)

**Team Topologies:**
- [ ] Enhance Team Topologies implementation with more substance (currently mostly conceptual)
- [ ] Add visual team topology rendering on canvas (e.g., interaction modes between teams)

**Team Flow:**
- [ ] Consider developing separate integrated tool for team flow (similar to CodeCohesion https://lnkd.in/grhy_XRp)

## Done
- [x] Remove redundant Fit to Map button from top bar (canvas controls already have fit view)
- [x] Stage labels in value stream view now show hover-based delete button (red X) for easier discoverability
- [x] Adding stages auto-positions by finding the largest gap (no longer prompts for position number)
- [x] Top menu buttons for add stage, actor, need, context clearer and cleaner CTAs (grouped in container with + prefix icons)
- [x] Fix project selection dropdown icon overlapping project name when name is long
- [x] Classify actors as internal or external with dotted border styling (https://userneedsmapping.com/docs/step-2-identifying-users/) - updated all sample projects
- [x] Add users and needs for Elan Extended Warranty sample project
- [x] Fix domain distillation locations for contexts in sample projects (ACME and cBioPortal now have proper distillation positions matching their strategic classifications)
- [x] Update README to reflect new capabilities and language (v0.6.1: Value Stream View, actors/user needs, temporal evolution, multi-project support, CodeCohesion API, all example projects)
- [x] Consolidate duplicated test fixtures (extracted shared mockState, mockContext, mockGroup, mockRelationship, mockKeyframe builders; migrated contextActions, groupActions, relationshipActions, temporalActions, and actorActions tests; eliminated ~350-400 lines of duplication)
- [x] Break down addKeyframeAction into pure functions (likely already have unit tests in temporalActions.test.ts)
- [x] Make strategic classification boundaries not magic numbers everywhere
- [x] Export function from builtInProjects that indicates a project is builtin/sample that can be used from store.ts to replace "origin = 'sample'" logic
- [x] Refactoring should clean up redundant comments (e.g. // autosave <- like this, and this -> // Track analytics, and this -> // Track property changes)
- [x] Refactor store.ts following extract-and-prove pattern (see STORE_REFACTORING_PLAN.md)
- [x] Add analytics (using Simple Analytics) - all 5 slices completed
  - [x] Analytics Slice 1: Product Validation - Core Usage Insights (project lifecycle, view switching, deployment context)
  - [x] Analytics Slice 2: Feature Adoption tracking (context/relationship/group CRUD events, property changes, DDD pattern usage)
  - [x] Analytics Slice 3: Onboarding & FTUE tracking (sample exploration, first milestones, drop-off analysis)
  - [x] Analytics Slice 4: Power Users & Retention (export/import tracking, return visits, engagement levels, canvas interactions)
  - [x] Analytics Slice 5: View-Specific Features (temporal keyframes, actors & needs, flow stage markers)
- [x] **[BUG]** Fix built-in projects overwriting user changes on app update
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
  - [x] Temporal Milestone 1: Basic Temporal Infrastructure (enable temporal mode, create keyframes, time slider UI)
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
