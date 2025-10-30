# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

For comprehensive documentation, see:
- **Product vision & goals**: [docs/VISION.md](docs/VISION.md)
- **Technical architecture & data model**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Behavioral requirements**: [docs/SPEC.md](docs/SPEC.md)
- **Implementation roadmap**: [docs/PLAN.md](docs/PLAN.md)
- **UX principles**: [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md)
- **Getting started**: [README.md](README.md)

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start local dev server
npm run build   # Build for production
```

## Project-Specific Conventions

### Code Organization
- **All types**: `src/model/types.ts` (single source of truth)
- **State management**: Zustand store in `src/model/store.ts`
- **Canvas**: React Flow patterns (custom nodes, edges, overlays)
- **UI components**: shadcn/ui (Radix primitives) + Tailwind CSS
- **Animation**: Framer Motion for view transitions

### Key Implementation Details

**Dual positioning system:**
Every BoundedContext has three position coordinates:
- `positions.flow.x` - horizontal position in Flow View
- `positions.strategic.x` - horizontal position in Strategic View
- `positions.shared.y` - vertical position (shared across both views)

**External contexts:**
- Cannot have repos assigned (`isExternal: true` blocks assignment)
- Show "External" badge and dotted ring visual treatment

**Undo/redo scope:**
- Applies only to structural canvas actions (add/move/delete context, add/delete relationship, assign/unassign repo, create/delete group)
- Text edits in InspectorPanel autosave directly and are NOT undoable

**DDD relationship patterns:**
Use fixed vocabulary from types.ts: `customer-supplier`, `conformist`, `anti-corruption-layer`, `open-host-service`, `published-language`, `shared-kernel`, `partnership`, `separate-ways`

**Groups (capability clusters):**
- Visual overlays only; deleting a group does not delete member contexts
- Can overlap (multiple groups covering same canvas area)

### Current Milestone

**Milestone 1**: Flow View core (see [docs/Milestone1_Prompt.md](docs/Milestone1_Prompt.md))
- Demo project: `examples/sample.project.json` (ACME E-Commerce platform)
- Focus: Visual canvas rendering with read-only inspector
- Not yet implemented: editing, dragging, repo assignment, undo/redo

### When Working on Features

1. Check [docs/PLAN.md](docs/PLAN.md) for milestone context and deliverables
2. Refer to [docs/SPEC.md](docs/SPEC.md) for behavioral requirements and validation rules
3. Follow architectural patterns in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. Match aesthetic guidelines in [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md)
5. Preserve product vision and positioning from [docs/VISION.md](docs/VISION.md)

## Important Constraints

- **Browser-based**: works entirely in the browser with client-side storage; no backend required for core functionality
- **ALWAYS prefer editing existing files** in the codebase. NEVER write new files unless explicitly required
- **NEVER proactively create documentation files** (*.md) or README files. Only create documentation files if explicitly requested by the User
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked
