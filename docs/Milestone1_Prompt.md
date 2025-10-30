# Claude Code Prompt — ContextFlow Milestone 1

You are working inside a React + Vite + TypeScript app called **ContextFlow**.

ContextFlow maps bounded contexts, their relationships, and code ownership. It supports two synchronized projections of the same model: **Flow View** and **Strategic View**. For now, we are implementing **Milestone 1** from `docs/PLAN.md`.

---

## 🎯 Goal
Render the **Flow View canvas** using the demo project at `examples/sample.project.json`.

Below are the key details you need to implement.

---

## 1. Data model and state
The types are in `src/model/types.ts`. The store is in `src/model/store.ts` and already loads the demo Project.

Use:
- `projects[projectId]`
- `activeViewMode` (currently `"flow"`)
- `selectedContextId`

Do **not** change data shapes. Consume the existing model.

---

## 2. What to build

### CanvasArea
Create a new `src/components/CanvasArea.tsx` that:

1. Renders each `BoundedContext` as a node.
   - Horizontal = `positions.flow.x`
   - Vertical = `positions.shared.y`
   - Both mapped from 0–100 to pixel coordinates.

2. Renders each `Relationship` as a curved edge.
   - Arrow → `toContextId` (upstream)
   - `shared-kernel` / `partnership` = undirected edge.

3. Node style rules:
   - **Fill color**
     - `core` → soft gold
     - `supporting` → pale blue
     - `generic` → light gray
   - **Border**
     - strong → thick solid
     - moderate → medium solid
     - weak → dashed / porous
   - **Size**
     - tiny/small/medium/large/huge → progressively larger
   - **Badges**
     - ⚠ Legacy if `isLegacy`
     - “External” + dotted ring if `isExternal`

4. Node selection:
   - Clicking sets `selectedContextId`.
   - Selected node visually highlights.

5. Axes:
   - X axis: stage markers from `project.viewConfig.flowStages[]` (e.g., "Discovery", "Selection", "Purchase", "Fulfillment", "Post-Sale")
   - Y axis: simple "Customer/User-facing" → "Enabling/Platform"

6. Enable React Flow pan/zoom.

---

## 3. Files to create / update

- ✅ Create `src/components/CanvasArea.tsx`
- ✅ Optionally create `src/components/InspectorPanel.tsx`
- ✏️ Update `src/App.tsx`
  - Replace center `<section>` placeholder with `<CanvasArea />`
  - Update right panel to show selected context info (read-only).

Keep the left sidebar, top bar, and overall layout.

---

## 4. Node details

| Property | Visual |
|-----------|---------|
| Fill color | core → gold, supporting → blue, generic → gray |
| Border | strong → thick, moderate → normal, weak → dashed |
| Size | tiny→huge mapped to node width/height |
| Badge | ⚠ Legacy (corner), “External” pill + dotted ring |

Approx sizes (width × height):  
tiny 120×70, small 140×80, medium 170×100, large 200×120, huge 240×140.

---

## 5. Edge details
- Directed curved edges (arrow toward upstream).
- `shared-kernel` and `partnership` → no arrow.
- Optionally label edges with `pattern` (e.g. “conformist”).

---

## 6. Inspector Panel (read-only)

Show for selected context:
- name
- purpose
- notes
- strategicClassification
- boundaryIntegrity + boundaryNotes
- codeSize.bucket
- isLegacy / isExternal

If none selected: “Select a context to inspect.”

---

## 7. Aesthetic style

Professional, minimal, neutral palette:
- Tailwind: soft neutrals, rounded corners, subtle shadows
- Avoid cartoonish styling
- `bg-neutral-50` / `bg-neutral-900` background variants

---

## 8. Acceptance Criteria

After running `npm install && npm run dev`, user should see:

✅ Canvas with nodes laid out by Flow View positions  
✅ Edges between contexts  
✅ X-axis stage labels  
✅ Left sidebar placeholder (“Unassigned Repos”)  
✅ Right sidebar shows info for selected context  

---

Deliver only the new components (`CanvasArea.tsx`, optional `InspectorPanel.tsx`) and small edits to `App.tsx`.  
Do not modify `store`, `types`, or example JSON.
