# ContextFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-virtualgenius%2Fcontextflow-blue?logo=github)](https://github.com/virtualgenius/contextflow)

**[🚀 Live Demo](https://contextflow.virtualgenius.com)** | Explore the ACME E-Commerce example!

**Map reality, not aspiration.**

ContextFlow is a visual DDD context mapper for analyzing bounded contexts, their relationships, and code ownership across two synchronized views: **Flow** (value stream) and **Strategic** (Wardley evolution).

![ContextFlow Screenshot](docs/context-flow-3.png)

## What is ContextFlow?

ContextFlow helps teams map and edit their system architecture as it actually exists — not as the slide deck says it should be. It captures:

- **Bounded contexts** with strategic classification (core/supporting/generic), boundary integrity (strong/moderate/weak), and visual properties
- **DDD relationship patterns** between contexts (customer-supplier, conformist, anti-corruption layer, open-host service, shared kernel, partnership, etc.)
- **Code ownership** linking repositories to contexts and teams via drag-and-drop
- **Team topology** connecting teams to their boards and responsibilities
- **Capability groups** as visual clusters of related contexts

The key differentiator: **two views of the same system**.

### Flow View
Shows how value and data move left-to-right through your system (stages are configurable per project: e.g., "Discovery → Selection → Purchase → Fulfillment → Post-Sale" for e-commerce, or "Ingest → Normalize → Analyze → Publish" for data pipelines)

![Flow View](docs/context-flow-1.png)

### Strategic View
Shows where each capability sits on the Wardley evolution axis (Genesis → Custom-built → Product/Rental → Commodity/Utility)

![Strategic View](docs/context-flow-2.png)

Switch between views live. Same contexts, same relationships — different conversations.

## Why ContextFlow?

### Map reality, not aspiration

Most architecture diagrams show the system you wish you had. ContextFlow helps you map:
- Bounded contexts as they actually exist in your codebase
- DDD strategic patterns with upstream/downstream power dynamics
- Which teams own which repos, and where ownership is unclear
- Boundary integrity — because not all context boundaries are created equal

### Two views of the same system

**Flow View** resonates with delivery teams and product owners: "Here's how work moves across our pipeline."

**Strategic View** resonates with leadership and architects: "Here's what's core vs commodity, where we're exposed, and what we should buy vs build."

Both views use the same underlying model. That's the unlock.

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
- Flow View with configurable value stream stages
- Strategic View with Wardley evolution bands
- Live view switching with animated transitions
- Full editing capabilities:
  - Drag nodes to reposition (updates per-view coordinates)
  - Multi-select and group drag with maintained relative positions
  - Edit context properties (name, purpose, classification, boundary integrity, notes)
  - Create/delete relationships with drag-to-connect workflow
  - Create/delete capability groups (translucent hulls)
- Repo sidebar with drag-to-assign functionality
- Team and ownership details with clickable Jira board links
- Inspector panel for editing context/relationship/group details
- Undo/redo for structural changes (add/move/delete context, relationships, repo assignments, groups)
- Theme toggle (light/dark mode)
- Project autosave (localStorage)
- Import/export project JSON

**Planned:**
- Multi-project picker (Miro-style recent boards)
- IndexedDB persistence for better performance
- Enhanced import/export options

## Getting Started

```bash
npm install
npm run dev
```

This starts the Vite dev server and opens the app in your browser.

The demo loads `examples/sample.project.json` — an ACME E-Commerce platform with 20 contexts, external services (Stripe, shipping carriers, fraud detection), and realistic DDD relationship patterns.

**Try it out:**
- Toggle between Flow and Strategic views
- Click a context to inspect and edit details
- Drag repos from the left sidebar onto contexts
- Multi-select contexts (Shift+click) and drag as a group
- Create relationships by dragging from one context to another
- Your changes autosave to localStorage

## Project Structure

- `src/` – React app code (TypeScript + Vite)
- `src/model/` – Core types and Zustand store
- `examples/` – Demo project data (`sample.project.json`, `cbioportal.project.json`)
- `docs/` – [VISION.md](docs/VISION.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [SPEC.md](docs/SPEC.md), [PLAN.md](docs/PLAN.md)

## Project Status

**Beta.** Milestones 1-3 complete (Flow View, Strategic View, editing, repos, teams, groups). Ready for field testing with real projects.

See [PLAN.md](docs/PLAN.md) for the full roadmap.

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
