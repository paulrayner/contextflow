# ContextFlow

**Map reality, not aspiration.**

ContextFlow is a visual DDD context mapper for analyzing bounded contexts, their relationships, and code ownership across two synchronized views: **Flow** (value stream) and **Strategic** (Wardley evolution).

## What is ContextFlow?

ContextFlow helps teams map their system architecture as it actually exists — not as the slide deck says it should be. It captures:

- **Bounded contexts** with strategic classification (core/supporting/generic), boundary integrity (strong/moderate/weak), and visual properties
- **DDD relationship patterns** between contexts (customer-supplier, conformist, anti-corruption layer, open-host service, shared kernel, partnership, etc.)
- **Code ownership** linking repositories to contexts and teams
- **Team topology** connecting teams to their boards and responsibilities

The key differentiator: **two views of the same system**.

- **Flow View** shows how value and data move left-to-right through your system (Discovery → Selection → Purchase → Fulfillment → Post-Sale)
- **Strategic View** shows where each capability sits on the Wardley evolution axis (Genesis → Custom-built → Product/Rental → Commodity/Utility)

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
- Connect contexts to actual GitHub repos
- Designed for DDD facilitators, platform architects, and teams doing strategic design

## Features

**Current (Milestone 1 in progress):**
- Visual canvas with pan/zoom
- Bounded context nodes with strategic classification, boundary integrity, size, legacy/external badges
- DDD relationship patterns rendered as directed edges
- Flow View with configurable value stream stages
- Strategic View with Wardley evolution bands
- Inspector panel for viewing context details

**Planned:**
- Full editing (drag nodes, create relationships, assign repos)
- Undo/redo for structural changes
- Repo sidebar with drag-to-assign
- Team and ownership details
- Group/cluster visualization
- Multi-project support
- Import/export project JSON

## Getting Started

```bash
npm install
npm run dev
```

This starts the Vite dev server and opens the app in your browser.

The demo loads `examples/sample.project.json` — an ACME E-Commerce platform with 20 contexts, external services (Stripe, shipping carriers, fraud detection), and realistic DDD relationship patterns.

## Project Structure

- `src/` – React app code (TypeScript + Vite)
- `src/model/` – Core types and Zustand store
- `examples/` – Demo project data (`sample.project.json`, `cbioportal.project.json`)
- `docs/` – [VISION.md](docs/VISION.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [SPEC.md](docs/SPEC.md), [PLAN.md](docs/PLAN.md)

## Project Status

**Pre-release.** Milestone 1 (Flow View core) is in active development.

Once M1 is complete and the tool is usable for basic context mapping, we'll release as open source under MIT license.

See [PLAN.md](docs/PLAN.md) for the full roadmap.

## Contributing

Not accepting external contributions yet (pre-release). Once we hit MVP and open-source the project, we'll welcome issues and PRs.

If you're interested in the vision or want to provide early feedback, see [VISION.md](docs/VISION.md).

## License

MIT (planned upon initial release)
