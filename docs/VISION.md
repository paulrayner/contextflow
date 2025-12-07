# VISION.md

## What is ContextFlow?
ContextFlow is a mapping and visualization tool for sociotechnical architecture.
It lets you model:
- Bounded contexts (DDD strategic design level)
- The relationships between them (Customer/Supplier, Conformist, Open Host Service, etc.)
- Which repos live in which context
- Which teams are responsible for which repos
- How value flows across the system
- Strategic positioning and evolution of capabilities
- The complete value chain from actors to user needs to solution components
- How your architecture evolves over time

It gives you three synchronized views of the same system:
1. **Value Stream View** – shows how value/data/work moves through configurable flow stages (e.g., Discovery → Selection → Purchase → Fulfillment for e-commerce)
2. **Distillation View** – classifies contexts using Nick Tune's Core Domain Chart (Business Differentiation vs Model Complexity) to identify core vs supporting vs generic domains
3. **Strategic View** – shows the complete Wardley Map value chain with Actors → User Needs → Contexts positioned on the evolution axis (Genesis → Custom-built → Product → Commodity)

You can switch between these views live. The map animates, but remains the "same" system. This is how you explain reality to delivery teams, architects, and execs using the same underlying model.

## Who is this for?
- Software / platform / architecture consultants who walk into a new org and need to quickly understand “what’s really going on.”
- Internal architecture leads or platform teams who need to communicate system boundaries, ownership, and pain points to leadership.
- Teams doing Domain-Driven Design at a strategic level (bounded contexts, upstream/downstream power).
- Organizations trying to see where they’re inventing vs where they’re depending on commodity/external services.

## What problem does it solve?
Most teams either have:
- A whiteboard sketch of their system (no ownership, no repos, no power relationships), or
- A service catalog or CMDB (lots of infra detail, no sociotechnical meaning).

ContextFlow sits in the middle:
- It’s a context map, not just a microservice diagram.
- It captures who depends on whose language and whose roadmap.
- It shows the gaps in boundaries (weak encapsulation, leaky ACL).
- It ties code and teams to those boundaries so you can have an accountability conversation, not a “cool drawing” conversation.

The user experience is designed to make domain visualization intuitive, expressive, and professional.

## Why Collaboration is Core

> "ContextFlow, for now, facilitates the visualization, but the hard work is still on the person using the software. Indeed, the value is in the conversations, workshops, and collaborations to model flow. I wouldn't use ContextFlow to replace that but to put it in a way that can evolve without the pain of maintaining 200 Miro disconnected and outdated Boards."
> — Aleix Morgadas

The tool doesn't replace the workshop - it captures and maintains the output. The real value comes from the **conversations and collaborations** that happen when people model together. ContextFlow's job is to make that output:

- **Evolvable** – can be updated as understanding grows
- **Connected** – not 200 disconnected Miro boards
- **Current** – not outdated snapshots from last quarter's offsite

This is why collaboration is free for all users, regardless of tier. Gating collaboration would undermine the tool's core purpose.

## Why browser-based with cloud sync?

ContextFlow runs in your browser with automatic cloud sync for seamless collaboration and cross-device access.

**Cloud-first benefits:**

- Real-time collaboration for workshops and team sessions
- Share projects via URL (anyone with link can view and edit)
- Work from any device without manual file transfers
- No local installation required

**Data handling:**

- Projects sync to Cloudflare infrastructure (industry-standard approach like Figma/Miro)
- Import/export as JSON for backups or migration
- Brief disconnections handled automatically (session-only offline support)

For consulting scenarios requiring local-only data, export projects as JSON files and share them manually rather than via URL.

## Why three views?
Because you need different conversations with different stakeholders:

- **Value Stream View** resonates with delivery teams and product owners: "Here's how data and work moves through our pipeline: Discovery → Selection → Purchase → Fulfillment." Configurable flow stages adapt to your domain (e-commerce, data platform, manufacturing, etc.).

- **Distillation View** resonates with architects and strategic planners: "Here's what's core and differentiating (high business differentiation, high complexity) vs what's supporting (low differentiation, high complexity) vs what's generic (low on both axes)." Uses Nick Tune's Core Domain Chart to prioritize investment and identify what should be core vs commodity.

- **Strategic View** resonates with leadership and strategy teams: "Here's the complete value chain from actors (who uses this?) to user needs (what problems?) to contexts (what components solve them?), all positioned on Wardley's evolution axis." Shows what's custom-built vs commodity, where you're exposed, and what to buy vs build.

All three views use the same underlying model of bounded contexts, relationships, teams, and repos. That is the unlock.

## Current capabilities (beyond original vision)

ContextFlow has evolved significantly:

- **Real-time collaboration** – Multiple users can edit the same project simultaneously with conflict-free sync
- **Cloud sync** – Projects sync to cloud automatically, accessible from any device via URL
- **Temporal evolution mode** – Timeline slider with keyframes showing how architecture changes over time
- **Live repository data** – CodeCohesion API integration for contributor statistics and ownership signals
- **Multi-project support** – Switch between projects with full autosave and isolation
- **Full editability** – Drag-to-connect relationships, multi-select group operations, organic blob-shaped capability groups
- **Three analytical models** – Value Stream (context mapping), Distillation (domain classification), Strategic (Wardley mapping)

## Future direction

Beyond the current beta, ContextFlow can:

- Auto-extract contributors from each repo's last 90 days of commits and surface likely "who really touches this in prod" (partially implemented via CodeCohesion API)
- Detect boundary integrity risk (e.g. a context marked "strong boundary" but multiple other contexts directly read its DB)
- Add Team Topologies alignment (stream-aligned vs platform vs enabling, etc.)
- Track change velocity and hotspots
- Surface organizational ownership drift ("repo assigned to Portal team but top committers aren't on Portal team anymore")
- Enhanced import/export (C4 diagrams, Mermaid, PlantUML interop)
- User authentication and access control for projects

The focus remains: make the map first, then enable analytics on top of that foundation.
