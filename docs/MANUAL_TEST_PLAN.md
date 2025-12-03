# Manual Test Plan - Cloud Sync Release

Use this checklist for manual testing before merging the cloud-sync branch.

## Prerequisites

- [ ] Production build: `npm run build`
- [ ] Preview server running: `npm run preview`
- [ ] Two browser windows ready (for sync testing)
- [ ] Network throttling available (DevTools)

---

## 1. Core Sync (Priority: Critical)

### 1.1 Create & Edit Project
- [ ] Create new project via "New Project" button
- [ ] Verify URL updates with project ID
- [ ] Add a context, verify it appears
- [ ] Rename the context in inspector
- [ ] Drag context to new position

### 1.2 Two-Browser Sync
- [ ] Copy project URL to second browser window
- [ ] Verify both windows show same project
- [ ] Edit context name in Browser A → appears in Browser B
- [ ] Drag context in Browser B → position updates in Browser A
- [ ] Add relationship in Browser A → appears in Browser B

### 1.3 Offline/Reconnect
- [ ] Go offline (DevTools Network: Offline)
- [ ] Make an edit (add context)
- [ ] Go back online
- [ ] Verify edit syncs (check second browser)
- [ ] Verify connection indicator shows correct states

---

## 2. Import/Export (Priority: Critical)

### 2.1 Export
- [ ] Load a project with contexts/relationships
- [ ] Export via menu → downloads JSON file
- [ ] Verify JSON is valid and contains all entities

### 2.2 Import
- [ ] Click Import, select exported JSON
- [ ] Verify new project created with correct data
- [ ] Verify URL updates to new project ID
- [ ] Verify project syncs to cloud (check in second browser)

---

## 3. Views (Priority: High)

### 3.1 Value Stream View
- [ ] Switch to Value Stream view
- [ ] Verify contexts render correctly
- [ ] Verify flow stages appear
- [ ] Drag context → position updates
- [ ] Add/edit/delete flow stage

### 3.2 Strategic View
- [ ] Switch to Strategic view
- [ ] Verify evolution axis labels appear
- [ ] Verify users and user needs render
- [ ] Drag context → position updates (independent of flow)
- [ ] Add user → create user need → connect to context

### 3.3 Distillation View
- [ ] Switch to Distillation view
- [ ] Verify Core Domain Chart axes
- [ ] Verify contexts positioned correctly
- [ ] Drag context → updates distillation position

### 3.4 View Switching
- [ ] Switch between all 3 views
- [ ] Verify animated transitions
- [ ] Verify positions are independent per view

---

## 4. Entities (Priority: High)

### 4.1 Contexts
- [ ] Create context
- [ ] Edit all properties in inspector (name, purpose, classification, boundary, size)
- [ ] Delete context
- [ ] Verify undo/redo works

### 4.2 Relationships
- [ ] Drag-to-connect two contexts
- [ ] Select relationship pattern
- [ ] Edit relationship in inspector
- [ ] Reverse relationship direction
- [ ] Delete relationship

### 4.3 Groups
- [ ] Multi-select contexts (Shift+click)
- [ ] Create group from selection
- [ ] Verify blob renders around contexts
- [ ] Edit group label/color
- [ ] Delete group (contexts remain)

### 4.4 Users & User Needs (Strategic View)
- [ ] Add user
- [ ] Add user need
- [ ] Connect user → user need → context
- [ ] Verify 2-hop highlighting when selecting user
- [ ] Delete user need connection
- [ ] Delete user

---

## 5. Undo/Redo (Priority: High)

- [ ] Add context → Undo → context removed
- [ ] Redo → context restored
- [ ] Move context → Undo → position restored
- [ ] Delete relationship → Undo → relationship restored
- [ ] Verify undo only affects YOUR changes (test in two browsers)

---

## 6. Built-in Projects (Priority: Medium)

- [ ] Select ACME E-Commerce sample
- [ ] Verify it creates a new cloud project (URL changes)
- [ ] Make an edit
- [ ] Select sample again → should create another new project
- [ ] Verify original sample is unmodified when selected fresh

---

## 7. Edge Cases (Priority: Medium)

### 7.1 Large Project
- [ ] Load ACME E-Commerce (20+ contexts)
- [ ] Verify performance is acceptable
- [ ] Zoom/pan smoothly
- [ ] Switch views smoothly

### 7.2 Error States
- [ ] Disconnect network during edit
- [ ] Verify offline modal appears
- [ ] Click retry → reconnects
- [ ] Verify changes synced after reconnect

### 7.3 External Contexts
- [ ] Select an external context
- [ ] Verify "External" badge shows
- [ ] Verify repo assignment is blocked

---

## 8. UI Polish (Priority: Low)

- [ ] Theme toggle works (light/dark)
- [ ] Fit to Map works
- [ ] Connection indicator shows correct state
- [ ] All tooltips display correctly
- [ ] No console errors during normal use

---

## Sign-off

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
| | | | |
