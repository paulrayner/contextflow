# Changelog

All notable changes to ContextFlow will be documented in this file.

---

## [0.5.0] - 2025-11-03

- Flow Stage markers now editable with position updates (undoable)
- Relationship editing for pattern, communication mode, and description
- Relationship pattern changes are undoable (text edits autosave)
- Selectable relationship edges on canvas
- Add existing contexts to groups individually or in batch
- Group membership changes fully undoable
- Comprehensive test suite with 27 passing tests across all features

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
