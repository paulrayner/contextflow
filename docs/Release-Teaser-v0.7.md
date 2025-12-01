# ContextFlow v0.7.0 - Release Highlights

## Value Propositions

**For Teams:** "See your software landscape together" - issues/hotspots for surfacing risks, team assignments for ownership clarity, and visual relationship patterns drive shared understanding across technical and business stakeholders.

**For Architects:** "Communicate strategic clarity" - full value chain from users to systems, ownership visibility, team assignments, and visual relationship patterns help translate complex technical reality for business stakeholders.

**For Consultants:** "The tool that teaches DDD while you use it" - educational tooltips, issues/hotspots for risk visualization, team management, and a guided experience make workshop facilitation smoother than generic whiteboarding.

**For Engineering Managers:** "Align teams to business capabilities" - see which teams own which contexts, identify organizational friction points, and use Team Topology classifications to evolve team structures.

**For Product Owners:** "Connect user needs to technical capabilities" - trace value from users through their needs to the systems that serve them, ensuring product decisions align with strategic domain investments.

---

## What's New

### Issues/Hotspots - Surface Risks Visually

Mark concerns, risks, and problems directly on bounded contexts with severity levels (info/warning/critical). Unlike sticky notes in Miro that get lost, these are first-class entities with distinct icons visible on the canvas. *Teams can identify and communicate challenges with other teams, product, and business stakeholders - driving shared understanding of sociotechnical risks and strategic opportunities.*

### Team Management with Context Assignment

Create and manage teams, then assign them to bounded contexts. See team names directly on the canvas. Links to Jira boards and Team Topology classifications (Stream-aligned, Platform, Enabling, Complicated Subsystem) help map organizational structure to software ownership. *Teams gain clarity on boundaries and dependencies. Architects can visualize Conway's Law in action.*

### Full Project Management

Create, rename, duplicate, and delete projects through a modern modal interface. Click the project name in the top bar to access all your projects in a visual grid with context counts and last-modified timestamps. Import projects with smart conflict handling - choose to replace existing or import as new with regenerated IDs. *Teams can maintain multiple project versions for different scenarios or experiments.*

### Full Value Stream Visibility

Users and User Needs now appear in Value Stream view (not just Strategic view). See the complete chain from users through their needs to the systems that serve them. *Helps teams connect their work to business outcomes and communicate alignment with stakeholders.*

### Ownership Categorization with Color Coding

Classify contexts by ownership level (project/mine, internal to org, external 3rd party) with optional color coding. Instantly see which parts of your landscape you control vs. depend on external parties. *Critical for teams assessing vendor risk and architects evaluating dependency strategies.*

### Educational Tooltips Throughout

Built-in DDD and Wardley Mapping concept explanations appear on hover - evolution stages, strategic classifications, relationship patterns, upstream/downstream dynamics. *Perfect for workshops and onboarding new team members.*

### Guided Getting Started Experience

New approach selector (User Journey First vs Systems First) with framed strategic views as "DDD and Wardley Mapping lenses." First-time users see contextual guidance rather than a blank canvas. *Reduces learning curve for workshop participants and teams new to strategic domain modeling.*

---

## Visual & UX Improvements

### Relationship Pattern Enhancements

- ACL/OHS indicator boxes perpendicular to edges
- Patterns Guide modal with SVG diagrams
- Bidirectional arrows for mutual patterns (Shared Kernel, Partnership)
- Swap direction button for relationships
- Power dynamics icons showing upstream vs downstream

*Teams can clearly see and discuss integration patterns and power dynamics between contexts.*

### Better Connection Workflows

- Drag-to-connect between contexts for relationships
- Always-visible connection handles
- Prevents invalid user→context connections (must flow through user needs)
- Smart overlap prevention when adding new contexts

### Problem Space / Solution Space Visual Separation

Warm background band distinguishes problem space from solution space on the canvas. *Helps teams and architects communicate to non-technical stakeholders which elements represent business capabilities vs. technical implementations.*

### Canvas Intelligence

- Contexts constrained to canvas bounds
- New contexts auto-positioned to avoid overlap
- Fit to Map includes all labels (stage labels, value chain axis)
- Auto-position flow stages by finding the largest gap

### Multi-Select and Group Operations

Shift-click to multi-select contexts. Drag selected groups while respecting group boundaries. Batch operations for managing complex maps efficiently.

---

## Polish & Quality of Life

- "Actor" renamed to "User" throughout - matching industry terminology
- Reorganized Settings: View Options first, then Help, Display, Integrations
- Toggle switches replacing pill buttons for Legacy/External flags
- Hover-based delete on stage labels
- Enter key to create issues
- Version tooltip on app logo
- Instant tooltips on all action buttons

### Context Mapping Case Study

The Elan Extended Warranty project now includes a full teaching case study for DDD workshops - demonstrating relationship patterns, strategic classification, and domain distillation in a realistic business scenario.

---

## Why ContextFlow?

Generic diagramming tools (Miro, Lucidchart, draw.io) can draw boxes and arrows, but they don't understand domain-driven design. ContextFlow is purpose-built for strategic modeling:

| Capability | ContextFlow | Generic Diagramming |
|------------|-------------|---------------------|
| DDD relationship patterns (ACL, OHS, etc.) | Built-in with visual indicators | Manual shapes/stickers |
| Issues/Hotspots with severity | First-class entities | Sticky notes (easily lost) |
| Team assignment to contexts | Native with Team Topologies | Manual annotations |
| Evolution/maturity tracking | Wardley-style axis | Not supported |
| Strategic classification | Core/Supporting/Generic built-in | Manual color-coding |
| Integrated complementary views | Value Stream, Strategic, Domain Distillation | Single view only |
| Educational tooltips | DDD concepts on hover | None |
| Ownership categorization | Built-in with color coding | Manual |

---

## Upgrading

Project data is automatically migrated to the latest schema. Your existing projects will continue to work seamlessly.

---

## By the Numbers

### Since v0.6.2 (7 days)

| Metric | Value |
|--------|-------|
| Commits | 169 |
| Features added | 60 |
| Bugs fixed | 58 |
| Files changed | 73 |
| Lines added | 11,304 |
| Lines removed | 2,852 |
| Test-related commits | 32 |

### Project Totals

| Metric | Value |
|--------|-------|
| Total commits | 308 |
| Tests passing | 711 |
| Lines of TypeScript | 26,409 |
| React components | 21 |
| Pure action functions | 66 |
| Test files | 31 |
| Sample projects | 4 |
| Development period | 32 days |
