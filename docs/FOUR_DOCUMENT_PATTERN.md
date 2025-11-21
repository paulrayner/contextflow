# The Four-Document Pattern for Software Projects

## Overview

This pattern establishes four foundational documents that together provide complete project context for both humans and AI assistants. Each document has a distinct purpose and audience, creating clear separation of concerns.

**The four documents:**
1. **VISION.md** - Product positioning & value proposition
2. **ARCHITECTURE.md** - Technical implementation decisions
3. **SPEC.md** - Behavioral requirements & constraints
4. **PLAN.md** - Implementation roadmap & delivery strategy

**Why this pattern works:**
- Clear boundaries prevent overlap and confusion
- Each document can evolve at its own pace
- AI assistants can quickly locate relevant context
- New team members understand both "what" and "why"
- Stakeholders can read VISION without technical details
- Developers can understand ARCHITECTURE without business context

---

## 1. VISION.md

### Purpose
Answers "Why does this exist?" and "Who is it for?"

### Audience
- Stakeholders and decision-makers
- Potential users or customers
- New team members seeking context
- AI assistants needing product understanding

### Core Sections

#### What is [Product Name]?
- 1-2 sentence elevator pitch
- Key capabilities (bullet list)
- Core value proposition
- How it differs from alternatives

**Template questions:**
- If someone asks "What does this do?", what's the answer?
- What are the 3-5 core capabilities?
- What views/modes/perspectives does it offer?

**Example structure:**
```
[Product] is a [category] tool for [purpose].
It lets you:
- [Capability 1]
- [Capability 2]
- [Capability 3]
```

#### Who is this for?
- Primary user personas
- Use cases and scenarios
- Organizations/roles that benefit

**Template questions:**
- Who are the primary users?
- What roles or job titles?
- What industries or contexts?
- What problems do they face today?

**Example structure:**
```
- [Persona 1] who need to [job-to-be-done]
- [Persona 2] trying to [achieve outcome]
- [Organization type] dealing with [pain point]
```

#### What problem does it solve?
- Current state (what exists today)
- Gap or pain point
- Desired outcome
- How this product bridges the gap

**Template questions:**
- What do people use today? (alternatives/workarounds)
- What's missing or broken?
- What becomes possible with this tool?
- What conversations or decisions does it enable?

**Example structure:**
```
Most teams either have:
- [Inadequate solution A] (lacks X, Y, Z)
- [Inadequate solution B] (has too much detail, misses the point)

[Product] sits in the middle:
- [Key differentiator 1]
- [Key differentiator 2]
- [Outcome it enables]
```

#### Why [Key Architectural Decision]?
For significant architectural choices (browser-based, offline-first, specific technology), explain the strategic reasoning.

**Template questions:**
- What are the most unusual/opinionated architectural choices?
- Why did we choose this approach?
- What user value does it unlock?
- What scenarios does it enable?

**Example structure:**
```
This design is particularly valuable for [scenario]:
- [Benefit 1]
- [Benefit 2]
- [Trust/security/performance advantage]
```

#### Why [Unique Feature/View]?
For distinctive features (dual views, specific visualizations), explain the strategic purpose.

**Template questions:**
- What makes this feature different?
- What conversations does it enable?
- Why can't users achieve this another way?

**Example structure:**
```
Because you need two different conversations:
- [View/Feature A] resonates with [audience]: [value proposition]
- [View/Feature B] resonates with [audience]: [value proposition]

Both use the same underlying model. That is the unlock.
```

#### Future direction
- Natural extensions beyond MVP
- What becomes possible once foundation is built
- Explicit non-goals to avoid scope creep

**Template questions:**
- What are logical next steps after MVP?
- What analytics/automation could we add?
- What should we explicitly NOT do (at least initially)?

**Example structure:**
```
Beyond the MVP, [Product] can:
- [Future capability 1]
- [Future capability 2]
- [Future insight 3]

All of those are natural evolutions after MVP.
The MVP is about [core focus], not [tempting distraction].
```

### Writing Guidelines
- Use present tense ("ContextFlow is..." not "ContextFlow will be...")
- Write for someone discovering the project for the first time
- Avoid technical implementation details (those go in ARCHITECTURE.md)
- Keep it readable by non-technical stakeholders
- Update infrequently (only when product direction changes)

---

## 2. ARCHITECTURE.md

### Purpose
Answers "How is it built?" at the technical level

### Audience
- Developers (human and AI)
- Technical decision-makers
- Future maintainers
- Integration partners

### Core Sections

#### Overview
Brief summary connecting to VISION.md

**Template:**
```
[Product] is a [technology stack] application for [purpose from VISION].
It presents [key technical capability].

The core of the app is:
- [Component 1]
- [Component 2]
- [Component 3]
```

#### Tech stack decisions
List key technology choices with brief rationale

**Template questions:**
- Language/runtime?
- UI framework?
- Build system?
- Styling approach?
- UI component library?
- State management?
- Persistence layer?
- Key libraries (canvas, animation, etc.)?

**Example structure:**
```
- Language: [TypeScript]
- UI framework: [React]
- Build: [Vite] (rationale: [why])
- Canvas: [React Flow] (rationale: [why])
  - Handles [key capabilities]
- Animation: [Framer Motion] (rationale: [why])
- State: [Zustand] (rationale: [why])
```

#### Data model
Complete TypeScript interfaces or schema definitions

**Template questions:**
- What are the core domain entities?
- What are their relationships?
- What metadata/attributes does each have?
- What enums or controlled vocabularies?

**Example structure:**
```typescript
export interface [CoreEntity] {
  id: string;
  name: string;
  // ... all fields with comments explaining semantics
}

export interface [Relationship] {
  // ... fields
}

// ... all core types
```

#### Semantics to respect
How data model fields map to visual/behavioral rules

**Template questions:**
- How do enum values map to visual styles?
- What are the rendering rules?
- What constraints must be maintained?
- What are the validation rules?

**Example structure:**
```
- [Field] → [visual property]
  - [value A] → [style A]
  - [value B] → [style B]
- [Field] → [behavior]
  - [condition] → [outcome]
```

#### Component layout
High-level component hierarchy

**Template questions:**
- What's the top-level component structure?
- What are the major UI regions?
- What are the key interactive components?

**Example structure:**
```
<App />
  <ComponentA />
  <ComponentB />
    <SubComponentB1 />
    <SubComponentB2 />
  <ComponentC />
```

#### Component specifications
For each major component, describe:
- Responsibilities
- Key features
- Interaction patterns
- Data flow

**Template for each component:**
```
### <ComponentName />
- [Primary responsibility]
- [Feature/capability 1]
- [Feature/capability 2]
- [Interaction pattern]
  - [Trigger] → [Outcome]
```

#### State management
Global state shape and update patterns

**Template questions:**
- What's the shape of global state?
- What state is local vs global?
- How do updates flow?
- What actions/commands exist?

**Example structure:**
```typescript
interface AppState {
  // ... state shape
}

// Key patterns:
- [User action] → [state change] → [UI update]
```

#### Persistence
How data is stored and loaded

**Template questions:**
- Where is data stored? (localStorage, IndexedDB, server, etc.)
- When does persistence happen? (autosave, manual, etc.)
- What's the import/export format?
- How does startup/initialization work?

#### Visual rules summary
Consolidated rendering rules for AI/developer reference

**Template questions:**
- What are all the visual styling rules?
- How do data values map to colors, borders, sizes, badges?
- What are the layout rules?

**Example structure:**
```
- [Visual property]:
  - [data value A] → [style A]
  - [data value B] → [style B]
- [Visual feature]:
  - [Trigger/condition]
  - [Rendering rule]
```

#### References
External resources, prior art, standards

**Template:**
- Specifications or standards followed
- Design patterns borrowed from
- Key libraries' documentation
- Academic papers or blog posts that informed decisions

### Writing Guidelines
- Be complete and precise
- Include actual code (interfaces, types, schemas)
- Use concrete examples
- Link to external documentation
- Update when technical decisions change
- Avoid "why" (that's in VISION) - focus on "what" and "how"

---

## 3. SPEC.md

### Purpose
Answers "What must it do?" - the behavioral contract

### Audience
- Developers implementing features
- QA/testers validating behavior
- AI assistants needing validation rules
- Product managers defining scope

### Core Sections

#### Goal
Brief statement of what the spec defines

**Template:**
```
Define what the MVP of [Product] must do, and the constraints it must respect.
This is the behavioral contract.
```

#### Core concepts users can create/edit
For each entity type, specify:
- All editable fields
- Field types and constraints
- How fields affect behavior/rendering
- Validation rules
- Special states or flags

**Template for each entity:**
```
### [Entity Name]
Fields:
- `fieldName` (type)
  - [How it affects behavior]
  - [Validation rules]
  - [Special semantics]
- ...

Rendering rules:
- [Field] → [visual outcome]

Constraints:
- [Rule that must hold]
```

#### Views/Modes
For each view or mode:
- What it displays
- Axis/dimension meanings
- Which data fields it uses
- Layout rules
- Interaction patterns

**Template for each view:**
```
### [View Name]
- [Axis/Dimension 1]: [meaning]
  - [Examples or ranges]
- [Axis/Dimension 2]: [meaning]
  - [Examples or ranges]
- Uses `[data fields]` for positioning
- [Special rendering rules]
```

#### Movement/Interaction rules
How user actions map to data changes

**Template:**
```
- [User action] in [View/Mode] → updates `[data field]`
- [User action] → [state change]
- [Gesture/Input] → [behavior]
```

#### Canvas/UI behavior requirements
Visual and interaction requirements

**Template sections:**
- Navigation (pan, zoom, fit-to-view)
- Selection behavior
- Drag and drop rules
- Visual feedback
- Edge cases (empty states, errors, etc.)

**Example structure:**
```
- [Feature]:
  - [Sub-behavior 1]
  - [Sub-behavior 2]
- [Interaction pattern]:
  - [Input] → [Output]
- [Constraint]:
  - [Rule that must be enforced]
```

#### Side panels and overlays
For each panel/overlay:
- When it appears
- What it displays
- What can be edited
- Actions available
- Visibility rules

**Template:**
```
### [Panel/Overlay Name]
When [Trigger]:
- Show [Content]
- Allow editing:
  - [Field 1]
  - [Field 2]
- Actions:
  - [Action 1] → [Outcome]
```

#### Persistence/project handling
How projects are saved, loaded, imported, exported

**Template questions:**
- What is the unit of persistence? (project, workspace, etc.)
- When does autosave happen?
- What import/export formats are supported?
- How does multi-project work?
- What happens on startup?

#### Undo/redo
What is undoable vs. not

**Template:**
```
Undo/redo applies to:
- [Action type 1]
- [Action type 2]

Undo/redo does NOT apply to:
- [Action type 3] (rationale: [why])
- [Action type 4] (rationale: [why])
```

#### Non-goals for MVP
Explicit scope boundaries

**Template:**
```
- No [feature out of scope]
- No [architecture pattern not needed]
- No [integration not required]
- No [analysis/automation not in scope]
```

### Writing Guidelines
- Be exhaustive (cover all behaviors)
- Use present tense and "must" language
- Specify both positive cases and constraints
- Include validation rules
- Call out edge cases
- Reference actual field names from ARCHITECTURE.md
- Update as new edge cases are discovered
- Keep behavioral (not implementation details)

---

## 4. PLAN.md

### Purpose
Answers "How do we build this incrementally?"

### Audience
- Development team
- Project managers
- Stakeholders tracking progress
- AI assistants understanding current milestone

### Core Sections

#### Purpose
Why this document exists

**Template:**
```
This is the implementation roadmap for [Product].
Each milestone is designed to produce something demoable and valuable on its own.
```

#### Demo fixture
If using a sample dataset for development:

**Template:**
```
We will use `[path/to/fixture]` as our demo fixture. That file encodes:
- [Entity type 1] with [characteristics]
- [Entity type 2] with [characteristics]
- [Realistic scenario/relationships]
```

#### Completed Milestones
Track what's been shipped

**Template for each:**
```
### ✅ Milestone N: [Name] (vX.Y.Z - Date)
- Status: COMPLETE
- All deliverables completed
- Key features:
  - [Feature 1]
  - [Feature 2]
- Verified: [git commit hash + message]
```

#### Current/Upcoming Milestones
For each milestone:
- Goal (what value it delivers)
- Deliverables (specific features/capabilities)
- Result (what becomes possible)

**Template for each milestone:**
```
## Milestone N: [Name]

### Goal
[1-2 sentence statement of value delivered]

### Deliverables
- [Feature 1]:
  - [Sub-requirement]
  - [Sub-requirement]
- [Feature 2]:
  - [Sub-requirement]
- [Integration point]:
  - [What it enables]

### Result
At the end of Milestone N you can:
- [Capability unlocked 1]
- [Capability unlocked 2]
- [Demo statement for stakeholders]

[Optional: "This is [MVP/consulting asset/production-ready/etc.]"]
```

#### Milestone Design Principles
**Questions to ask when planning milestones:**
- Can we demo this to stakeholders?
- Does it deliver end-user value on its own?
- What's the minimum scope to ship something useful?
- What dependencies must be completed first?
- How do we avoid a "big bang" integration?

**Anti-patterns to avoid:**
- "Milestone 1: Set up database" (no user value)
- "Milestone 2: Build all CRUD" (no demo story)
- "Milestone 3: Wire everything together" (integration nightmare)

**Good patterns:**
- Each milestone = vertical slice of user value
- Each milestone is independently demoable
- Later milestones build on earlier ones
- MVP is identified as a specific milestone

#### Work in Progress Notes
For milestones currently being implemented:

**Template:**
```
### Work in Progress Notes

**Current Status ([Date]):**
- [What's been completed]
- [Current implementation approach]
- [Test status]

**Blocking Issue:**
[Description of blocker]

**Evidence:**
- [Symptom 1]
- [Symptom 2]
- [Specific failure case]

**Root Cause:**
[Analysis of why it's failing]

**Solution Approaches to Evaluate:**
1. [Approach A]: [Description]
2. [Approach B]: [Description]
3. [Approach C]: [Description]

**Next Steps:**
- [Action 1]
- [Action 2]
```

### Writing Guidelines
- Start with high-level milestone outline
- Each milestone should be independently valuable
- Specify demo scenarios
- Update status as work progresses
- Move completed milestones to "Completed" section
- **NEVER include time estimates** (no "1 week", "3 months", timeline tables)
- Focus on scope and deliverables, not duration
- Use WIP notes to capture current state and blockers
- Link to git commits when marking milestones complete

---

## Document Lifecycle & Update Triggers

### When to Update Each Document

**VISION.md** - Rarely
- Product direction changes
- New target audience identified
- Core value proposition shifts
- Major architectural philosophy changes

**ARCHITECTURE.md** - Moderately
- Technology stack changes
- New major component added
- Data model expands
- State management patterns evolve

**SPEC.md** - Frequently
- New edge cases discovered
- Validation rules clarified
- New entity types added
- Behavioral requirements refined

**PLAN.md** - Continuously
- Milestone completed (move to "Completed" section)
- Starting new milestone (add WIP notes)
- Priorities shift
- Blockers discovered

### Cross-Reference Patterns

Documents should reference each other:

**VISION.md:**
- References ARCHITECTURE.md for technical decisions
- Does NOT reference SPEC or PLAN

**ARCHITECTURE.md:**
- References VISION.md for context
- May reference SPEC.md for behavioral constraints
- Does NOT reference PLAN

**SPEC.md:**
- References ARCHITECTURE.md for data model field names
- References VISION.md for feature context
- Does NOT reference PLAN

**PLAN.md:**
- References all three for context
- Links to specific sections when relevant

**Example cross-references:**
```markdown
See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete data model.
Refer to [SPEC.md](SPEC.md) for validation rules.
Check [VISION.md](VISION.md) for product positioning.
```

---

## Decision-Making Guide

### "Where does this belong?"

**VISION vs SPEC:**
- **VISION**: Why the feature exists, what conversations it enables
- **SPEC**: Exactly how the feature behaves, what it must do

**SPEC vs ARCHITECTURE:**
- **SPEC**: What happens (user perspective, behavioral contract)
- **ARCHITECTURE**: How it's implemented (technical perspective)

**PLAN vs SPEC:**
- **PLAN**: When we build it, in what order, grouped with what
- **SPEC**: What the complete feature does when finished

**ARCHITECTURE vs PLAN:**
- **ARCHITECTURE**: Technical design decisions (timeless)
- **PLAN**: Implementation sequence (time-bound)

### Examples

**User story: "As a consultant, I need to save projects locally"**
- **VISION**: "Browser-based with offline capability" rationale
- **SPEC**: Autosave behavior, import/export formats, startup behavior
- **ARCHITECTURE**: localStorage → IndexedDB, serialization format, state structure
- **PLAN**: Milestone 1 uses localStorage, Milestone 2 migrates to IndexedDB

**Design decision: "We use Framer Motion for animations"**
- **VISION**: Smooth view transitions matter because [user value]
- **SPEC**: Nodes animate horizontally when switching views
- **ARCHITECTURE**: Animation library choice, implementation approach
- **PLAN**: Animation added in Milestone 2

---

## Quick Start Checklist

To implement this pattern in a new project:

1. **Start with VISION.md:**
   - [ ] Write elevator pitch
   - [ ] Identify 3-5 user personas
   - [ ] Articulate the problem/gap
   - [ ] Explain key architectural decisions (if opinionated)
   - [ ] List 3-5 future extensions (but mark as post-MVP)

2. **Write ARCHITECTURE.md:**
   - [ ] List technology stack with brief rationale
   - [ ] Define core data model (types/interfaces/schemas)
   - [ ] Map data fields to visual/behavioral rules
   - [ ] Sketch component hierarchy
   - [ ] Describe state management approach
   - [ ] Specify persistence mechanism

3. **Draft SPEC.md:**
   - [ ] For each entity, list all editable fields + constraints
   - [ ] Define all views/modes and their axes/dimensions
   - [ ] Specify interaction patterns (drag, click, etc.)
   - [ ] Define undo/redo scope
   - [ ] List explicit non-goals

4. **Create PLAN.md:**
   - [ ] Identify 3-5 milestones that each deliver demo-able value
   - [ ] Milestone 1 should be minimal but impressive
   - [ ] Each milestone builds on previous
   - [ ] Identify which milestone = MVP
   - [ ] Avoid time estimates, focus on scope

5. **Set up CLAUDE.md (or similar):**
   - [ ] Reference all four documents
   - [ ] Add project-specific conventions
   - [ ] Note current milestone
   - [ ] Add quick reference commands

---

## Example CLAUDE.md Integration

```markdown
# CLAUDE.md

## Quick Reference

For comprehensive documentation, see:
- **Product vision & goals**: [docs/VISION.md](docs/VISION.md)
- **Technical architecture & data model**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Behavioral requirements**: [docs/SPEC.md](docs/SPEC.md)
- **Implementation roadmap**: [docs/PLAN.md](docs/PLAN.md)

## Current Milestone

**Milestone 2**: Editing + Strategic View (see [docs/PLAN.md](docs/PLAN.md))

## When Working on Features

1. Check [docs/PLAN.md](docs/PLAN.md) for milestone context and deliverables
2. Refer to [docs/SPEC.md](docs/SPEC.md) for behavioral requirements and validation rules
3. Follow architectural patterns in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. Preserve product vision from [docs/VISION.md](docs/VISION.md)
```

---

## Benefits of This Pattern

**For human developers:**
- Onboarding: Read VISION → ARCHITECTURE → current milestone in PLAN
- Feature work: Check SPEC for requirements, ARCHITECTURE for patterns
- Clarity: Each document has single responsibility

**For AI assistants:**
- Can quickly locate relevant context
- Understands both business and technical constraints
- Knows current milestone and priorities
- Can validate proposed changes against SPEC

**For stakeholders:**
- VISION.md is readable without technical knowledge
- PLAN.md shows progress without implementation details
- Clear product direction

**For the project:**
- Prevents scope creep (VISION + SPEC define boundaries)
- Maintains architectural coherence (ARCHITECTURE is single source of truth)
- Enables parallel work (clear interfaces between components)
- Preserves institutional knowledge
