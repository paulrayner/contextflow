# ContextFlow

ContextFlow is a local-first tool for mapping bounded contexts, relationships, repos, and team ownership
across two synchronized projections:

- **Flow View**: left→right value stream (e.g. Data Ingestion → Curation → Analysis → Delivery)
- **Strategic View**: Wardley-style evolution (Genesis → Custom-built → Product/Rental → Commodity/Utility)

Each bounded context captures:
- purpose
- boundary integrity (strong/moderate/weak)
- legacy flag
- external flag
- code size bucket (tiny→huge)
- coordinates in both views

Repos are tied to contexts. Teams are tied to repos. Teams include Jira board links.

## Project structure

- `src/` – React app code
- `src/model/` – Core TypeScript types + editor store
- `examples/` – Example project data (`cbioportal.project.json`)
- `docs/` – Vision, Spec, Architecture, Plan (product and technical direction)

## Getting started

```bash
npm install
npm run dev
```

This will start the local Vite dev server.

## Goals

- Run entirely locally (no backend required)
- Be usable in client environments under NDA
- Help consultants and teams map what *actually is*, not just what the slide deck says

Licensing TBD (intended as open source / open core).
