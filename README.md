# ContextFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-virtualgenius%2Fcontextflow-blue?logo=github)](https://github.com/virtualgenius/contextflow)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?logo=discord&logoColor=white)](https://discord.gg/ABRnay8PM5)

**[🚀 Live Demo](https://contextflow.virtualgenius.com)** | Explore the ACME E-Commerce example!

**Map reality, not aspiration.**

ContextFlow is a visual DDD context mapper for analyzing bounded contexts, their relationships, and code ownership across three complementary views guiding you through strategic domain analysis: **Value Stream** (context mapping), **Distillation** (domain classification), and **Strategic** (Wardley mapping).

![ContextFlow Screenshot](docs/context-flow-3.png)

## What is ContextFlow?

ContextFlow helps teams map and edit their system architecture as it actually exists — not as the slide deck says it should be. It captures:

- **Bounded contexts** with strategic classification (core/supporting/generic), boundary integrity (strong/moderate/weak), and visual properties
- **DDD relationship patterns** between contexts (customer-supplier, conformist, anti-corruption layer, open-host service, shared kernel, partnership, etc.)
- **Wardley Map value chain** with actors, user needs, and contexts showing complete problem-to-solution flow
- **Code ownership** linking repositories to contexts and teams via drag-and-drop
- **Team topology** connecting teams to their boards and responsibilities
- **Capability groups** as organic blob-shaped visual clusters using Catmull-Rom smoothing
- **Temporal evolution** showing how your architecture changes over time with keyframes and timeline playback

The key differentiator: **three models of your sociotechnical system**.

### Value Stream View
**Context mapping**: Shows how value and data move left-to-right through your system. Map bounded contexts and visualize how work flows between them. Stages are configurable per project (e.g., "Discovery → Selection → Purchase → Fulfillment → Post-Sale" for e-commerce, or "Ingest → Normalize → Analyze → Publish" for data pipelines).

![Value Stream View](docs/context-flow-1.png)

### Distillation View
**Domain classification**: Classify bounded contexts using Nick Tune's Core Domain Chart. Position contexts by Business Differentiation (Y-axis) and Model Complexity (X-axis) to identify your core domains vs supporting/generic capabilities. This helps prioritize strategic investment and identify what should be core vs commodity.

![Distillation View](docs/context-flow-4.png)

### Strategic View
**Wardley mapping**: Shows the complete Wardley Map value chain with **Actors** (users of the map) → **User Needs** (problems to solve) → **Contexts** (solution components), all positioned along the evolution axis (Genesis → Custom-built → Product/Rental → Commodity/Utility). Analyze strategic positioning and dependencies.

![Strategic View](docs/context-flow-2.png)

Switch between views live. Same contexts, same relationships, same teams — different analytical models of your system.

## Why ContextFlow?

### Map reality, not aspiration

Most architecture diagrams show the system you wish you had. ContextFlow helps you map:
- Bounded contexts as they actually exist in your codebase
- DDD strategic patterns with upstream/downstream power dynamics
- Which teams own which repos, and where ownership is unclear
- Boundary integrity — because not all context boundaries are created equal

### Three models of your sociotechnical system

Each view is a different analytical model of the same bounded contexts, relationships, teams, and repos:

**Value Stream View** (context mapping) — Start here. Map contexts and how work flows through your system. Resonates with delivery teams and product owners: "Here's how value moves through our pipeline."

**Distillation View** (domain classification) — Classify your contexts. Use Nick Tune's Core Domain Chart to identify core vs supporting vs generic domains. Prioritize strategic investment: "What should we excel at vs what should we commoditize?"

**Strategic View** (Wardley mapping) — Complete the strategic picture. Position contexts on the evolution axis with actors and user needs. Resonates with leadership and architects: "Here's what's core vs commodity, where we're exposed, and what we should buy vs build."

All three views analyze the same system — different lenses, different strategic insights.

### Built for practitioners

- Browser-based, no backend required
- Import/export as JSON
- Drag repos onto contexts, link teams to boards
- Full editing: drag nodes, create relationships, organize into groups
- Autosave with undo/redo for structural changes
- Light/dark theme support
- Designed for DDD facilitators, platform architects, and teams doing strategic design

## Features

**Current:**
- Visual canvas with pan/zoom and fit-to-map
- Bounded context nodes with strategic classification, boundary integrity, size, legacy/external badges
- DDD relationship patterns rendered as directed edges with pattern-specific styling
- **Value Stream View** for context mapping with editable flow stages (rename, reposition, add/delete via TopBar)
- **Distillation View** with Nick Tune's Core Domain Chart for domain classification (Business Differentiation vs Model Complexity)
- **Strategic View** for Wardley mapping with three-layer value chain structure:
  - Actors (users of the map) with connections to User Needs
  - User Needs (problem space) connecting Actors to Contexts
  - Contexts (solution components) positioned on evolution axis
  - 2-hop connection highlighting showing complete value chains
- Live view switching with animated transitions between all three models
- **Temporal evolution mode** with timeline slider, keyframes, and playback animation to visualize architecture changes over time
- Full editing capabilities:
  - Drag nodes to reposition (updates per-view coordinates)
  - Multi-select and group drag with maintained relative positions
  - Edit context properties (name, purpose, classification, boundary integrity, notes)
  - Create/delete relationships with drag-to-connect workflow
  - Select and edit relationship edges (pattern, communication mode, description)
  - Create/delete capability groups with organic blob-shaped rendering
  - Add existing contexts to groups individually or in batch operations
  - Create/edit/delete actors and user needs with full connection management
- Repo sidebar with drag-to-assign functionality
- **CodeCohesion API integration** for live repository statistics and contributor data
- Team and ownership details with clickable Jira board links
- Inspector panel for editing context/relationship/group/actor/user need details
- **Multi-project support** with project switcher dropdown
- Undo/redo for structural changes (add/move/delete context, relationships, repo assignments, groups, keyframes)
- Theme toggle (light/dark mode)
- IndexedDB persistence with autosave
- Import/export project JSON

**Planned:**
- Enhanced import/export options
- Accessibility improvements
- Keyboard shortcuts documentation overlay

## Getting Started

```bash
npm install
npm run dev
```

This starts the Vite dev server and opens the app in your browser.

The app includes multiple example projects:
- **ACME E-Commerce** — 20 contexts with external services (Stripe, shipping carriers, fraud detection) and realistic DDD relationship patterns
- **cBioPortal** — Complete genomics platform with user needs value chain demonstrating actors → needs → contexts flow
- **Elan Extended Warranty** — DDD strategic patterns reference for teaching workshops
- **Empty Project** — Practice template for your own context mapping

**Try it out:**
- Start in Value Stream View to map contexts and visualize flow
- Switch to Distillation View to classify contexts using the Core Domain Chart
- Move to Strategic View to add actors, user needs, and complete Wardley mapping
- Use the timeline slider to create keyframes and visualize temporal evolution
- Click a context to inspect and edit details
- Drag repos from the left sidebar onto contexts
- Multi-select contexts (Shift+click) and drag as a group
- Create relationships by dragging from one context to another
- Your changes autosave to IndexedDB

## Project Structure

- `src/` – React app code (TypeScript + Vite)
- `src/model/` – Core types and Zustand store
- `examples/` – Demo project data (`sample.project.json`, `cbioportal.project.json`, `elan.project.json`, `empty.project.json`)
- `docs/` – [VISION.md](docs/VISION.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [SPEC.md](docs/SPEC.md), [PLAN.md](docs/PLAN.md), [TODO.md](docs/TODO.md)

## Project Status

**Beta.** Milestones 1-6 in progress:
- ✅ M1-M3: Value Stream View, Strategic View, editing, repos, teams, groups
- ✅ M4: Full editability (flow stages, relationships, group membership)
- ✅ M5: Wardley Map value chain (actors, user needs, 2-hop highlighting)
- 🚧 M6: Organic blob-based group rendering (in progress)

Includes temporal evolution mode, CodeCohesion API integration, and multi-project support. Ready for field testing with real projects.

See [PLAN.md](docs/PLAN.md) for the full roadmap and [TODO.md](docs/TODO.md) for current development tasks.

## Foundations & Resources

ContextFlow builds on established practices in domain-driven design, team topologies, and strategic mapping:

**Start Here:**
- [Adaptive Socio-Technical Systems with Architecture for Flow](https://www.infoq.com/articles/adaptive-socio-technical-systems-flow/) (InfoQ) — explains how system architecture and team design must co-evolve
- [Architecture for Flow: Adaptive Systems with Domain-Driven Design, Wardley Mapping, and Team Topologies](https://www.amazon.com/Adaptive-Systems-Domain-Driven-Wardley-Topologies/dp/0137393032) by _Susanne Kaiser_ — integrates DDD, Wardley Mapping, and Team Topologies into a unified approach

**Domain-Driven Design & Context Mapping:**
- [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas) by DDD Crew — visual template for documenting bounded contexts
- [Context Mapper](https://contextmapper.org/) — complementary DSL-based context mapping tool

**Wardley Mapping:**
- [On mapping and the evolution axis](https://blog.gardeviance.org/2014/03/on-mapping-and-evolution-axis.html) by Simon Wardley — foundational article explaining the evolution axis (Genesis → Custom-built → Product → Commodity)
- [Learn Wardley Mapping](https://learnwardleymapping.com/) — interactive guide to strategic mapping
- [Wardley Maps book](https://medium.com/wardleymaps) by Simon Wardley — original methodology and essays
- [Core Domain Patterns](https://medium.com/nick-tune-tech-strategy-blog/core-domain-patterns-941f89446af5) by Nick Tune — practical framework for classifying domains as core, supporting, or generic

**Team Topologies:**
- [Team Topologies: Organizing Business and Technology Teams for Fast Flow](https://www.amazon.com/Team-Topologies-Organizing-Business-Technology/dp/1942788819) by Matthew Skelton & Manuel Pais
- [Domain-Driven Design Distilled](https://www.amazon.com/Domain-Driven-Design-Distilled-Vaughn-Vernon/dp/0134434420) by Vaughn Vernon — concise guide to strategic DDD

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Whether you're reporting bugs, suggesting features, or submitting pull requests, your help is appreciated. See [VISION.md](docs/VISION.md) for the product vision and direction.

## License

MIT - see [LICENSE](LICENSE) file for details
