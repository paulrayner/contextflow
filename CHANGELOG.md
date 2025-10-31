# Changelog

All notable changes to ContextFlow will be documented in this file.

---

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
