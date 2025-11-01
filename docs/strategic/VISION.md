# Vision: Temporal Evolution in ContextFlow

## Foundation: Evolution vs. Maturity in Wardley Mapping

### Why Evolution, Not Maturity?

Wardley Maps use **evolution**, not maturity, as their horizontal axis. This is a deliberate strategic choice made by Simon Wardley around 2004/05.

**The problem with maturity models:**
- Maturity can be weaponized by vendors selling legacy technology
- Vendors often portray emerging practices (like cloud computing) as "immature"
- This suggests organizations should continue buying "mature" established products
- Billions have been wasted on this sales tactic
- Maturity is almost always championed by salespeople trying to sell outdated technology

**Why evolution is better:**
- Evolution is driven by supply and demand competition, not vendor positioning
- Components naturally evolve from left to right over time
- Evolution carries objective meaning: rare/uncertain → common/standardized
- Higher evolution = lower risk of failure, better understood, more commoditized

### The Evolution Axis

Every component in Wardley mapping has a position on the horizontal evolution axis:

| Stage | Characteristics |
|-------|----------------|
| **Genesis** | Novel, rare, not-yet-extant, poorly understood, high uncertainty |
| **Custom-built** | Unique solutions, bespoke, requires specialists |
| **Product/Rental** | Packaged solutions, rental/product offerings available |
| **Commodity/Utility** | Standardized, ubiquitous, utility-like (electricity model) |

**Key principle:** Everything evolves from left to right under the forces of supply and demand competition.

---

## What is Temporal Evolution?

Temporal evolution adds a **time dimension** to ContextFlow's dual-view mapping system. Instead of showing only the current state of your architecture, you can visualize **how your system evolves over time**—where contexts move, what appears, what disappears, and the trajectory of strategic change.

This enables architects and consultants to:
- **Communicate roadmaps visually** instead of through spreadsheets or slide decks
- **Test strategic scenarios** by mapping "what if we migrate in 2027?"
- **Show evolution velocity** to leadership ("here's how quickly we're commoditizing this capability")
- **Identify risks** when components don't evolve as expected

## The Core Insight

Simon Wardley emphasizes that **thinking about changes over time is one of the most powerful features of Wardley mapping**. Yet most mapping tools treat time as an afterthought—either ignoring it entirely or requiring separate static snapshots.

ContextFlow's temporal evolution makes time a **first-class dimension** using a keyframe-based model inspired by animation:
- Your current map represents "today"
- You create keyframes at future dates (2027, 2030, etc.)
- Each keyframe shows where you think contexts will be at that point in time
- A time slider lets you scrub through and **see the animated transition**

This transforms architecture mapping from **static documentation** into **strategic simulation**.

## Who Needs This?

### Architecture Consultants
Walking into a new organization, you need to:
- Map the current state (as-is architecture)
- Identify strategic problems (bottlenecks, legacy debt, vendor lock-in)
- **Propose a transformation roadmap** showing before and after states
- Communicate the migration path to stakeholders

**With temporal evolution:**
- Create today's map during discovery
- Add a 2027 keyframe showing the target architecture
- Scrub the timeline to demonstrate the transformation visually
- Show exactly which contexts move, merge, or disappear

### Platform/Architecture Leads
Managing a large sociotechnical system, you need to:
- Plan multi-year platform migrations
- Sequence architectural changes based on dependencies
- **Communicate roadmap alignment** to engineering teams and executives
- Track whether evolution is happening as planned

**With temporal evolution:**
- Map quarterly or yearly keyframes aligned to roadmap milestones
- Show how contexts evolve from custom-built → product → commodity
- Visualize the "strategic intent" for leadership approval
- Compare actual evolution vs planned (future: live data integration)

### Domain-Driven Design Practitioners
Applying DDD at strategic scale, you need to:
- Define bounded contexts and their relationships (current state)
- **Anticipate how domain boundaries will change** as the business evolves
- Plan context decomposition or merging
- Communicate strategic design decisions over time

**With temporal evolution:**
- Show how monoliths decompose into bounded contexts
- Visualize new contexts appearing as business capabilities grow
- Demonstrate consolidation when contexts prove too granular
- Align technical evolution with business strategy timeline

### Technology Strategy Teams
Planning technology bets and vendor decisions, you need to:
- Assess which capabilities should be built vs bought vs rented
- **Predict when emerging technologies will mature** enough to adopt
- Plan migration away from vendor-locked or custom-built solutions
- Justify investment timing to finance/leadership

**With temporal evolution:**
- Map genesis capabilities on the left (high uncertainty)
- Create keyframes showing expected commoditization timeline
- Visualize "build now, buy later" vs "rent now, build later" scenarios
- Show risk if evolution doesn't happen as expected

## Problem Statement

**Without temporal evolution, architecture maps are snapshots in time.** You can show where you are, but not where you're going or how you'll get there.

This leads to:
- **Roadmaps disconnected from reality**: Excel timelines don't show architectural dependencies
- **Lack of strategic alignment**: Teams don't understand how their work fits into the evolution trajectory
- **Missed risks**: No visibility into whether components are evolving as expected
- **Poor communication**: Execs see static boxes and arrows, not strategic movement
- **Analysis paralysis**: No way to test "what if" scenarios visually

**Existing solutions fall short:**
- Static Wardley maps: Require creating separate maps for each time period, no visualization of transition
- Maturity models: Can be weaponized by vendors, don't reflect natural evolution
- Gantt charts/roadmap tools: Show task timelines, not architectural movement
- Architecture diagrams: Show structure, not evolution

## The Solution: Keyframe-Based Temporal Mapping

ContextFlow's temporal evolution feature brings **animated architectural roadmapping** to strategic domain mapping.

### Core Mechanism: The Always-Present Time Slider

Inspired by Chris Simon's insight, the time slider is:
- **Always visible** when temporal mode is enabled
- **Defaults to today's date**
- **Shows current positions** until you define future states

This makes temporal thinking **unavoidable**—you can't ignore the time dimension because it's right there in the interface.

### Creating the Future: Keyframes

Instead of trying to animate every moment, you define **discrete keyframes** at strategic dates:
- **2027**: Post-platform-migration architecture
- **2029**: After legacy decommissioning
- **2032**: Fully commoditized state

Each keyframe captures:
- Where contexts will be positioned (in both Flow and Strategic views)
- Which contexts exist (new ones appear, old ones disappear)
- Labels describing what this keyframe represents

### Visualizing the Journey: Interpolation and Animation

The magic happens when you **scrub the time slider**:
- Contexts smoothly animate between keyframe positions
- You see the **trajectory** of evolution, not just before/after
- The **speed** of movement becomes visible (fast vs gradual change)
- Intermediate dates show interpolated positions

Optional visualization modes:
- **Animated playback**: Watch the evolution unfold automatically
- **Trajectory arrows**: See static paths showing before→after movement
- **Ghost overlays**: Preview future positions while viewing current state

### Strategic Questions Enabled

With temporal evolution, you can ask and answer:

**Evolution velocity:**
- "How quickly is our custom-built auth moving toward commodity?"
- "Should we accelerate by adopting Auth0 instead?"

**Architectural transitions:**
- "What does our system look like in 3 years if we migrate to event-driven?"
- "Where will the bottlenecks be in 2028?"

**Technology bets:**
- "If vector databases become commodity by 2027, what changes?"
- "What if they don't—what's our backup plan?"

**Team planning:**
- "Which contexts will need different skills in 2030?"
- "Where should we invest in platform capabilities now?"

**Risk analysis:**
- "What if this vendor-locked component doesn't commoditize as expected?"
- "How brittle is our plan if Component X evolves faster/slower than predicted?"

## How It Fits Into ContextFlow's Views

ContextFlow has multiple views of the same system:
- **Strategic View (Wardley Map)**: Evolution stage (Genesis → Commodity)
- **Flow View**: Value stream order (left → right through the process)
- **Distillation View**: Team topology and organizational structure

**Temporal evolution applies ONLY to Strategic View.**

### Why Strategic View Only?

The Strategic View is where Wardley's evolution axis lives. Temporal evolution shows **how components naturally commoditize over time** due to market forces and competition. This is the core insight of Wardley mapping.

In contrast:
- **Flow View** shows process sequence, which is typically more stable (you don't constantly reorder your value stream)
- **Distillation View** shows team/org structure, which evolves through different mechanisms (reorgs, not market evolution)

### What Changes Over Time in Strategic View

When scrubbing the timeline in Strategic View:
- Contexts move horizontally (left → right) as they evolve from genesis → commodity
- Contexts may move vertically as their position in the value chain changes
- New contexts may appear (genesis innovations)
- Old contexts may disappear (deprecated/replaced capabilities)

### Other Views Remain Static

When temporal mode is active:
- **Flow View**: Positions remain fixed across all keyframes (no temporal evolution)
- **Distillation View**: Structure remains fixed across all keyframes (no temporal evolution)
- Only Strategic View shows animated evolution over time

## Success Metrics

How we'll know temporal evolution is valuable:

**User Engagement:**
- % of projects that enable temporal mode
- Average number of keyframes per project
- Time spent scrubbing/viewing timeline

**Outcome Indicators:**
- Users report using ContextFlow for roadmap planning (not just current state documentation)
- Architecture consultants use temporal mode in client presentations
- Platform teams align their delivery roadmap to ContextFlow keyframes

**Qualitative Feedback:**
- "This makes strategic conversations so much clearer"
- "Leadership finally understood our migration plan"
- "We caught a dependency issue by visualizing the timeline"

## Future Enhancements (Beyond MVP)

Once the core temporal feature is proven:

**Scenario branching:**
- "Optimistic timeline" vs "Conservative timeline"
- Compare multiple strategic options side-by-side

**Milestone integration:**
- Link keyframes to real roadmap dates from Jira/Linear
- Auto-update timeline when milestones shift

**Collaboration:**
- "Team A's view of 2027" vs "Team B's view"
- Merge different stakeholder perspectives

**Live data integration:**
- Track actual evolution vs planned
- Alert when components aren't evolving as expected
- Show "we're behind schedule" indicators

**Export and sharing:**
- Generate slideshow or video of evolution
- Export timeline as animated GIF for presentations
- Embed interactive timeline in Confluence/Notion

## Why This Matters

Architecture is not static. Systems evolve—through intentional migration, emergent complexity, technological maturity, and competitive pressure.

**Temporal evolution transforms ContextFlow from a mapping tool into a strategic simulation environment.** It lets architects and consultants not just document reality, but **model the future** and test the path to get there.

This aligns perfectly with ContextFlow's mission: to make sociotechnical architecture **visible, understandable, and actionable**.

---

## References

- **Wardley, Simon.** "On mapping and the evolution axis." *Bits or pieces?* blog, 2014. [https://blog.gardeviance.org/2014/03/on-mapping-and-evolution-axis.html](https://blog.gardeviance.org/2014/03/on-mapping-and-evolution-axis.html)
- **Chris Simon conversation** (Oct 2024) on temporal mapping UX patterns and keyframe model
- **Wardley Mapping community resources:** [https://community.wardleymaps.com/](https://community.wardleymaps.com/)
