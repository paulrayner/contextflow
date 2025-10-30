# VISION.md

## What is ContextFlow?
ContextFlow is a mapping and visualization tool for sociotechnical architecture.
It lets you model:
- Bounded contexts (DDD strategic design level)
- The relationships between them (Customer/Supplier, Conformist, Open Host Service, etc.)
- Which repos live in which context
- Which teams are responsible for which repos
- How value actually flows across the system

It gives you two synchronized views of the same system:
1. **Flow View** – shows how value / data / work moves left → right through the organization.
2. **Strategic View** – shows where each capability sits in terms of strategic evolution / commoditization (Wardley-style).

You can switch between these views live. The map itself animates horizontally, but remains the “same” system. This is how you explain reality to delivery teams and execs using the same model.

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

## Why offline / local first?
Consulting reality:
- You often work under NDA on-site or in walled-off VPCs.
- You’re given a dump of repos, not production access.
- You need to map “how things really are” without uploading data to some SaaS.

So ContextFlow:
- Runs locally.
- Autosaves locally.
- Lets you import/export a single `project.json`.
- Doesn’t push data anywhere unless you explicitly export.

That “no leak by default” stance builds immediate trust in the room.

## Why two views (Flow View and Strategic View)?
Because you need two different conversations:
- **Flow View** resonates with delivery teams and product owners: “Here’s how data and work moves across our value stream: ingest → normalize → analyze → publish.”
- **Strategic View** resonates with leadership: “Here’s what’s core and differentiating vs what’s commodity or external; here’s where we’re bleeding and brittle; here’s where we’re reinventing something that should be a utility.”

Both views use the same underlying model. That is the unlock.

## Future direction
Beyond the MVP, ContextFlow can:
- Auto-extract contributors from each repo’s last 90 days of commits and surface likely “who really touches this in prod.”
- Detect boundary integrity risk (e.g. a context marked “strong boundary” but multiple other contexts directly read its DB).
- Add Team Topologies alignment (stream-aligned vs platform vs enabling, etc.).
- Track change velocity and hotspots.
- Surface organizational ownership drift (“repo assigned to Portal team but top committers aren’t on Portal team anymore”).

All of those are natural evolutions after MVP. The MVP is about making the map, not running analytics.
