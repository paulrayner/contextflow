# ContextFlow v0.8.0 - Release Highlights

## The Big Feature: Real-Time Collaboration

**Work together on your domain models.** Multiple users can now edit the same project simultaneously with changes syncing instantly. No more emailing JSON files or screen-sharing during workshops.

- See collaborators' cursors and selections in real-time
- Automatic conflict resolution - no merge headaches
- Works across any network connection

---

## Value Propositions

**For Teams:** "See your software landscape together" - real-time collaboration means workshop participants, distributed team members, and stakeholders can all contribute to the same model simultaneously. Issues/hotspots surface risks, team assignments clarify ownership, and visual relationship patterns drive shared understanding.

**For Architects:** "Communicate strategic clarity" - run collaborative modeling sessions with remote teams. Full value chain from users to systems, ownership visibility, and visual relationship patterns help translate complex technical reality for business stakeholders - now in real-time.

**For Consultants:** "The tool that teaches DDD while you use it" - facilitate workshops where every participant can interact with the model, not just watch you draw. Educational tooltips, issues/hotspots for risk visualization, and a guided experience make remote facilitation as effective as in-person.

**For Engineering Managers:** "Align teams to business capabilities" - invite team leads to collaborative sessions. See which teams own which contexts, identify organizational friction points, and use Team Topology classifications to evolve team structures together.

**For Product Owners:** "Connect user needs to technical capabilities" - join architects in mapping sessions to trace value from users through their needs to the systems that serve them, ensuring product decisions align with strategic domain investments.

---

## What's New in v0.8

### Real-Time Collaboration

Edit projects with your team simultaneously. Changes appear instantly for all participants. Perfect for distributed teams and remote workshops. No setup required - just share the project URL.

### Automatic Cloud Sync

Projects automatically sync to the cloud. Your work is saved and accessible from any device. Local projects from v0.7 are seamlessly migrated on first use.

### Share Project Dialog

One-click sharing with copyable project URL. Invite collaborators by sending a link - they'll see your model and can start contributing immediately.

### Offline Mode Support

Lost your connection? ContextFlow keeps working. An indicator shows when cloud features are unavailable, and the app automatically reconnects with exponential backoff when the network returns.

### Connection Status Visibility

Cloud status indicator in the top bar shows your connection state at a glance. Know instantly whether your changes are syncing.

### Improved Auto-Positioning

New users and user needs now auto-position in the largest available gap on the canvas, avoiding overlap with existing elements.

---

## What's in v0.7 (included)

### Issues/Hotspots - Surface Risks Visually

Mark concerns, risks, and problems directly on bounded contexts with severity levels (info/warning/critical). Unlike sticky notes in Miro that get lost, these are first-class entities with distinct icons visible on the canvas.

### Team Management with Context Assignment

Create and manage teams, then assign them to bounded contexts. See team names directly on the canvas. Links to Jira boards and Team Topology classifications (Stream-aligned, Platform, Enabling, Complicated Subsystem) help map organizational structure to software ownership.

### Full Project Management

Create, rename, duplicate, and delete projects through a modern modal interface. Click the project name in the top bar to access all your projects in a visual grid with context counts and last-modified timestamps.

### Full Value Stream Visibility

Users and User Needs now appear in Value Stream view (not just Strategic view). See the complete chain from users through their needs to the systems that serve them.

### Ownership Categorization with Color Coding

Classify contexts by ownership level (project/mine, internal to org, external 3rd party) with optional color coding. Instantly see which parts of your landscape you control vs. depend on external parties.

### Educational Tooltips Throughout

Built-in DDD and Wardley Mapping concept explanations appear on hover - evolution stages, strategic classifications, relationship patterns, upstream/downstream dynamics.

### Guided Getting Started Experience

New approach selector (User Journey First vs Systems First) with framed strategic views as "DDD and Wardley Mapping lenses." First-time users see contextual guidance rather than a blank canvas.

---

## Visual & UX Improvements

### Relationship Pattern Enhancements

- ACL/OHS indicator boxes perpendicular to edges
- Patterns Guide modal with SVG diagrams
- Bidirectional arrows for mutual patterns (Shared Kernel, Partnership)
- Swap direction button for relationships
- Power dynamics icons showing upstream vs downstream

### Better Connection Workflows

- Drag-to-connect between contexts for relationships
- Always-visible connection handles
- Prevents invalid user→context connections (must flow through user needs)
- Smart overlap prevention when adding new contexts

### Problem Space / Solution Space Visual Separation

Warm background band distinguishes problem space from solution space on the canvas.

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

The Elan Extended Warranty project includes a full teaching case study for DDD workshops - demonstrating relationship patterns, strategic classification, and domain distillation in a realistic business scenario.

---

## Why ContextFlow?

Generic diagramming tools (Miro, Lucidchart, draw.io) can draw boxes and arrows, but they don't understand domain-driven design. ContextFlow is purpose-built for strategic modeling:

| Capability | ContextFlow | Generic Diagramming |
|------------|-------------|---------------------|
| Real-time collaboration | Built-in, zero config | Varies by tool |
| DDD relationship patterns (ACL, OHS, etc.) | Built-in with visual indicators | Manual shapes/stickers |
| Issues/Hotspots with severity | First-class entities | Sticky notes (easily lost) |
| Team assignment to contexts | Native with Team Topologies | Manual annotations |
| Evolution/maturity tracking | Wardley-style axis | Not supported |
| Strategic classification | Core/Supporting/Generic built-in | Manual color-coding |
| Integrated complementary views | Value Stream, Strategic, Domain Distillation | Single view only |
| Educational tooltips | DDD concepts on hover | None |
| Ownership categorization | Built-in with color coding | Manual |
| Automatic cloud sync | Built-in | Requires manual save/export |

---

## Upgrading

Project data is automatically migrated to the latest schema. Your existing projects will continue to work seamlessly and will be synced to the cloud on first use.

---

## By the Numbers

### Since v0.7.0 (9 days)

| Metric | Value |
|--------|-------|
| Commits | 67 |
| Features added | 9 |
| Bugs fixed | 1 |

### Project Totals

| Metric | Value |
|--------|-------|
| Total commits | 391 |
| Tests passing | 711+ |
| Lines of TypeScript | 28,000+ |
| React components | 25+ |
| Sample projects | 4 |
| Development period | 41 days |
