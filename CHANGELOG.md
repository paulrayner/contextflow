# Changelog

All notable changes to ContextFlow will be documented in this file.

---

## [0.6.1] - 2025-11-05

- Empty Project template for practicing context mapping in production demo
- Value Stream view label replacing Flow view for clearer terminology
- cBioPortal demo map enhanced with complete user needs value chain (7 user needs connecting 3 actors to contexts)
- Architectural rule enforcement: all actor-to-context connections must flow through user needs

## [0.6.0] - 2025-11-03

- Three-layer Wardley Map structure in Strategic View: Actors → User Needs → Contexts
- UserNeed entities with name, description, position along evolution axis, and visibility toggle
- Actor→Need connections showing which actors have which needs
- Need→Context connections showing which contexts fulfill which needs
- Complete value chain visualization with 2-hop connection highlighting
- UserNeed management in InspectorPanel with navigation to connected actors and contexts
- Horizontal drag positioning for UserNeeds along evolution axis (vertical fixed at middle layer)
- Green-themed UserNeed nodes with Target icon distinct from blue Actor nodes
- Delete UserNeed cascades to remove all connected Actor→Need and Need→Context edges
- Full undo/redo support for UserNeeds and all connection operations
- Optimized vertical spacing: Actors at y=50, UserNeeds at y=200, Contexts at y=700+
- 18 new tests covering UserNeed CRUD and connection management (all passing)
- Sample project demonstrates complete e-commerce value chains across 5 user needs

## [0.5.0] - 2025-11-03

- Interactive Flow Stage editing: click labels to rename, drag to reposition along X-axis
- Add new Flow Stages via TopBar button (visible in Flow View only)
- Delete Flow Stages via right-click context menu (with confirmation, prevents deleting last stage)
- Flow Stage changes are undoable (label and position edits, add/delete operations)
- Click relationship edges on canvas to select and edit in InspectorPanel
- Edit relationship DDD pattern via dropdown (8 canonical patterns, undoable changes)
- Edit relationship communication mode and description (autosaves on blur, not undoable)
- Delete relationships from InspectorPanel with confirmation
- Add existing contexts to groups individually or in batch from InspectorPanel
- "Add All Available" button for bulk group membership operations
- Group membership changes fully undoable (including batch operations as single undo)
- Edit group labels and notes directly in InspectorPanel (autosaves, not undoable)
- Streamlined InspectorPanel layout: actors and teams moved near top, groups and repos repositioned for better visual hierarchy
- Removed redundant section headings and decorative elements for cleaner information display
- Standardized text input styling with shared constants for consistency
- Moved "Use CodeCohesion API" toggle to global Settings dialog (from per-context setting)
- Aligned Code and Boundary dropdowns vertically with narrower widths
- Validation ensures unique Flow Stage labels and positions
- Comprehensive test suite with 27 passing tests across all M4 features
- Complete SPEC.md compliance achieved for all interactive editing operations

## [0.4.0] - 2025-11-01

- Temporal evolution mode for Strategic View showing context positions over time
- Interactive timeline slider with year markers and keyframe indicators
- Keyframe creation via double-click on timeline to capture context positions at specific dates
- Keyframe editing mode to adjust future state positions (lock/unlock with Edit button)
- Keyframe management: edit labels, duplicate, delete via context menu
- Timeline playback animation with play/pause controls to visualize evolution
- Context position interpolation with smooth animation between keyframes
- Context fade in/out effects when appearing or disappearing at different time periods
- Groups and relationships automatically hidden during keyframe editing for clarity
- Jump to current year with "Now" button
- Temporal position display in Inspector Panel showing evolution stage at selected date

## [0.3.0] - 2025-11-01

- Multi-project support with project switcher dropdown in top bar
- CodeCohesion API integration for live repository data (contributors and stats)
- Repository statistics display showing file count, lines of code, and primary language
- Top 5 contributors from last 90 days (when CodeCohesion API is enabled)
- Collapsible repo info pills with expandable details panel
- cBioPortal demo project added alongside ACME E-Commerce example
- Repo and team chips now use consistent blue styling for visual harmony
- Teams section moved before repositories in inspector panel
- GitHub repository links improved with better color contrast
- API configuration extracted to config file for future user-configurable integrations

## [0.2.0] - 2025-10-30

- Strategic View with Wardley evolution bands (Genesis/Custom-Built/Product/Commodity)
- Animated horizontal transitions when switching between Flow and Strategic views
- Full context editing in Inspector Panel (all metadata fields)
- Context creation and deletion with confirmation
- Node dragging to reposition contexts (updates appropriate view coordinates)
- Undo/Redo for structural actions (add/move/delete context)
- Keyboard shortcuts (Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo, Escape to deselect)
- IndexedDB persistence (migrated from localStorage for better performance)
- Project import/export (JSON file upload/download)
- Top bar with view toggle, Fit to Map, and project name display
- Dark mode toggle
- Autosave on all changes
- Dynamic edge routing for shortest path connections between contexts
- Light mode as default theme

## [0.1.0] - 2025-10-30

**Milestone 1: Flow View Foundation**

- Flow View canvas with dual-axis visualization (flow stages horizontal, value delivery vertical)
- Visual bounded context nodes with size-based representation (tiny to huge based on code size)
- Strategic classification via node fill colors (core: gold, supporting: blue, generic: gray)
- Boundary integrity visualization (strong: solid border, moderate/weak: dashed border)
- DDD relationship edges with pattern labels on hover
- Stage labels and Y-axis labels that pan/zoom with canvas
- Inspector panel with read-only context details
- Collapsible unassigned repos sidebar with persistent state
- Sample ACME E-Commerce project demonstrating DDD context mapping
- Browser-based architecture with client-side JSON storage
