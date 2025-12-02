# TODO

## In Progress

(nothing currently in progress)

## Backlog

### Next release - SAAS Cloud Edition - Collaborative Editing

- [ ] Collaborative editing of projects together, so a team could work on them together

### SAAS Cloud Edition

- [ ] Select Stage, then select context, doesn't switch inspector to context. Does seem to work when select need after stage though.
- [ ] Implement SAAS hosting (orgs & users etc) - SAAS_MONETIZATION_STRATEGY.md
- [ ] Repo management
- [ ] Add about page? link to repo? link to VG.com
- [ ] Update virtualgenius.com with fresh images & licensing/pricing
- [ ] Add logo
- [ ] Implement ANALYTICS_PLAN.md
- [ ] Add new project description: goal/purpose, scope, creator name? created? last modified? (how does this match to Wardley Mapping step 1 - Purpose?)


### Integrations

- [ ] Import from a Big Picture EventStorming timeline (subprocesses between pivotal events as value stream stages, systems as contexts, actors as users, pivotal events as user needs? hotspots as issues?) exported from EventStormer (eventstormer.virtualgenius.com)
- [ ] Export to EventCatalog?
- [ ] Integrate glossary with Contextive?

### UX/Polish

- [ ] Add keyboard shortcuts documentation overlay (Cmd/Ctrl+?)
- [ ] Hide context strategic classification and evolution stage values in inspector until explicity set in appropriate views?
- [ ] Enable contexts to be connected by top and bottom as well as the sides
- [ ] When I select a boundary should it highlight its relationship connections? I thought it was supposed to
- [ ] Check how shared kernel is represented (should probably be overlapping contexts?)
- [ ] Add elan working starter project, with sample stages, sample contexts already populated, for training classes. Refine case study for relationship types.
- [ ] Add optional actor attributes: goal(s), challenges
- [ ] Not clear how to add a context to a group
- [ ] Add group didn't work for Leads Management. It added a group blob, but it is outside of leads management!
- [ ] Accessibility checks
- [ ] Responsive design
- [ ] Distillation - can a context overlap subdomain boundaries? what would this tell us if it did?
- [ ] Add search/filter for contexts, repos, teams

### Docs

- [ ] Delete old docs (PLAN.md, SPEC.md, ACTORS_NEEDS_...)
- [ ] Update ARCHITECTURE.md, UX_GUIDELINES.md
- [ ] Update README.md with fresh images

### Temporal Evolution Enhancements

- [ ] Temporal Milestone 2: Interpolation polish (smooth animations, snap-to-keyframe refinements)
- [ ] Temporal Milestone 3: Keyframe Management UI (keyframe list panel, context visibility per keyframe, copy keyframe)
- [ ] Temporal Milestone 4: Visualization Enhancements (trajectory overlay, animated playback, ghost preview mode, quarter granularity)

### Team Topologies

- [ ] Enhance Team Topologies implementation with more substance (currently mostly conceptual)
- [ ] Add visual team topology rendering on canvas (e.g., interaction modes between teams)

### Team Flow

- [ ] Consider developing separate integrated tool for team flow (similar to CodeCohesion https://lnkd.in/grhy_XRp)

## Done

- [x] Project management (create, rename, duplicate, delete projects with modal UI and import conflict handling)
- [x] Fix TypeScript errors across codebase (UserConnection rename, position structures, test fixtures)
- [x] Team management UI (view, create, update, delete teams with context cleanup)
- [x] Show issue labels on canvas (toggle in Settings)
- [x] Assign team names to contexts (team assignment dropdown in Context inspector)
- [x] Reorganize Settings menu for discoverability (View Options with Context Colors first, Help, Display, Integrations)
- [x] Implement context categorization based on ownership levels (project/mine|internal to org|external 3rd party) with color coding option in Settings
- [x] Add Issues/Hotspots feature - mark notes, concerns, and issues of varying severity (info/warning/critical) on bounded contexts, inspired by EventStorming hot spots
- [x] Revamp Getting Started Guide with approach selector (User Journey First vs Systems First), dedicated stages step with EventStorming context, and strategic views framed as DDD/Wardley Mapping lenses
- [x] Change "actor" -> "user" everywhere in the app where appropriate. This will make it consistent with Susanne's article and user needs mapping.
- [x] Add onboarding/tutorial for first-time users
- [x] Add grouping of elements and bulk-move
- [x] Context boundary width should more obviously reflect boundary strength (weak=dotted thin, external=dashed)
- [x] Add informational overlays/help throughout app by default (can turn off in settings) - hover tooltips for evolution stages, strategic classifications, and view tabs with educational content
- [x] Hide context description in box when code size is tiny or small, and add hover
- [x] Don't allow context to be dragged outside of canvas boundary
- [x] Mark out "Problem Space" + "Solution Space" (or maybe use "Problem Domain") areas
- [x] Improve graphical representation of ACL and OHS (check what DDD Crew do in their context mapping template, and in contextmapper.org)
- [x] Fix flickering labels on relationship names
- [x] New context added should not overlap an existing context
- [x] Fix context overlap in distillation view (grid distribution on view switch + grid-based positioning for new contexts)
- [x] Remove UPDATE buttons next to context strategic classification and evolution stage in inspector
- [x] Display helpful message when someone tries to connect actor<->context without user need
- [x] Enable reversing context relationships (swap button in Inspector Direction section + right-click context menu on relationship edges)
- [x] Add explanation for each context relationship type (power dynamics icons, collapsible "About" section, comprehensive Patterns Guide modal with SVG diagrams, upstream/downstream clarification note)
- [x] Fix overrunning of labels by relationship names
- [x] Should be able to select a Need->Context line. Should highlight similar to the actor-need line highlighting we just implemented (line and connected user need and context highlight)
- [x] Should be able to select and delete need->context line
- [x] Should be able to select a user->need line. Should highlight similar to a context relationship line (line and connected actor and need highlight)
- [x] Change Y-axis labels for value chain to "Visible" / "Invisible"
- [x] Make huge node size YUGE (240x240 square dimensions)
- [x] Fix Delete key not working on Mac/Firefox (added onNodesDelete handler and deleteKeyCode=['Backspace', 'Delete'] to React Flow)
- [x] Use upstream/downstream labels for context relationships in inspector (symmetric patterns like shared-kernel and partnership show as "Mutual")
- [x] Fix Fit to Map to include stage labels and value chain labels in viewport bounds
- [x] Fix connections (make easier to find and attach connection points)
- [x] Enable drag connections between contexts
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
