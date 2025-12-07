# Susanne Kaiser Feature Ideas for ContextFlow

**Source**: Conversation with Susanne Kaiser (2025-10-02)

## Key Themes

Susanne's core insight: The ability to **overlay multiple perspectives** (data flow, team flow, change flow) to identify bottlenecks and dependencies in the system.

---

## Feature Suggestions

### 1. Multiple Flow Overlays

Support for different types of flow visualizations that can be overlaid:

- **Data flow** - how data flows through the system (discovery → selection → purchase)
- **Team/Change flow** - how changes propagate through the value chain

### 2. Value Stream Hierarchy

- **External value streams** - customer-facing flows
- **Internal value streams** - internal teams that support the external value streams
- Ability to visualize how internal streams support external ones

### 3. Flow Blockers & Dependencies Visualization

Identify and highlight:

- **Blockers** between teams
- **Handoffs** that interrupt flow
- **Wait times** where teams depend on others
- Teams that are "sitting in the flow of change and interrupting it"

### 4. Team Self-Sufficiency Analysis

- Visualize whether teams provide **self-service capabilities** vs creating dependencies
- Help identify where teams are blocking each other

### 5. Coaching/Guidance Features

- Guidance on "how to start" with DDD/domain modeling
- Similar to what Woody Zuill does with software teaming
- Help users understand good practices

### 6. Tooling for Wardley Mapping Canvas

Susanne mentioned she needs tooling and sees ContextFlow as complementary to her canvas work.

---

## Implementation Status (as of 2025-12)

| Feature | Status | What Exists |
|---------|--------|-------------|
| **Flow Layers/Overlays** | 0% | Three views exist (Flow, Strategic, Distillation) but not overlayable layers within a view |
| **Dependency & Blocker Visualization** | 0% | No blocking indicators, handoff highlighting, or critical path |
| **Value Stream Grouping** | 30% | Groups exist but no `streamType` (external/internal/supporting) |
| **Team Assignment Layer** | 40% | Teams can be assigned to contexts, but no visual team boundary overlay |
| **Guided Workflows/Coaching** | 50% | Welcome modal, Getting Started Guide, InfoTooltips exist; no health checks |
| **Flow Simulation** | 0% | Not implemented |

### Related Infrastructure Already Built

- **Team assignment to contexts** - `teamId` field exists, store actions work
- **Team Topologies types** - stream-aligned, platform, enabling, complicated-subsystem
- **Groups** - Organic blob rendering, but no stream type classification
- **Three analytical views** - Flow, Strategic, Distillation (view switching, not overlays)
- **DDD relationship patterns** - All 8 patterns with power dynamics visualization
- **Educational tooltips** - InfoTooltip system with conceptDefinitions

---

## Potential Additions

### Quick Wins (Low Effort, High Alignment)

1. **Add `streamType` to Groups**
   - Add field: `streamType: 'external' | 'internal' | 'supporting'`
   - Visual differentiation (bolder borders for external, dashed for supporting)
   - Builds on existing Group infrastructure

2. **Add blocking/handoff metadata to relationships**
   - Extend `Relationship` type with `isBlocking?: boolean`, `handoffType?: string`
   - Visual indicators on edges (red for blocking, yellow for handoff)
   - Builds on existing edge rendering

3. **Team boundary overlay**
   - Toggle to show team ownership as colored regions
   - Identify contexts with no team or multiple teams
   - Builds on existing `teamId` assignment

4. **Health check panel**
   - Analyze map for common anti-patterns
   - Examples: "Context X has 5 upstream dependencies", "No ACL for external context Y"
   - Could be a new panel or modal

### Bigger Bets (Higher Effort, Transformative)

1. **Flow Simulation Mode**
   - Select a context and simulate "a change starts here"
   - Animate how it propagates through relationships
   - Highlight blocking points and wait times
   - Calculate "time to value" based on relationship types

2. **Multiple Overlay Layers**
   - Layer selector in Flow View
   - Toggle between: Data Flow, Team Flow, Change Flow
   - Different edge colorings/styles per layer

3. **Coaching/Guided Workflows**
   - Step-by-step wizard for mapping a value stream
   - "Health check" that suggests improvements
   - Pattern recommendations based on context relationships

---

## Priority Recommendations

For Susanne's use cases, the highest-impact additions would be:

1. **Value Stream Grouping with `streamType`** - Directly addresses her external/internal value stream hierarchy need
2. **Blocker/Handoff visualization on relationships** - Core to identifying flow interruptions
3. **Team boundary overlay** - Shows team ownership and potential coordination overhead

These three features together would enable the "overlay multiple perspectives to find bottlenecks" workflow she described.
