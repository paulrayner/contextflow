# Analytics Implementation Plan for ContextFlow

## Scope: Enable usage tracking to guide product decisions as a solo founder

**Goal:** Track how end-users interact with ContextFlow so you (Paul) can validate product-market fit, prioritize features, and improve onboarding. Analytics provides actionable insights in Simple Analytics dashboard.

**Key Decision:** Use **project-level identifiers** (like EventCatalog's catalog IDs) to distinguish different projects while respecting user privacy.

**Perspective:** You are the **user** of this analytics system. Simple Analytics dashboard is your **UI**. Each slice delivers insights you can act on.

---

## Implementation Slices

### **Slice 1: Product Validation - Core Usage Insights**

**Value for you (Paul):** Answer "Is anyone actually using ContextFlow?" and "Which views do they prefer?"

**What gets delivered:**
- Simple Analytics script added to [index.html](../index.html)
- Analytics utility module ([src/utils/analytics.ts](../src/utils/analytics.ts)) with:
  - Deployment context detection (hosted_demo/self_hosted/localhost)
  - Project-level identifier (hashed for privacy)
  - Developer mode flag (opt-out for contributors)
  - Silent error handling
  - TypeScript types
- View switching events (`view_switched` with metadata)
- Global metadata on all events:
  - `deployment`: Where app is running
  - `app_version`: Package version
  - `project_id`: Hashed project ID

**Questions answered in Simple Analytics dashboard:**
1. "How many people are visiting?" (page views)
2. "Which deployment type: hosted demo, self-hosted, or localhost?"
3. "Which view is most popular: Flow, Strategic, or Distillation?"
4. "Is Distillation view even worth the complexity?"
5. "How many distinct projects are being created?"

**Testing:**
- TDD: Unit tests for analytics utility (deployment context, project ID hashing)
- Integration test: View switching triggers correct events
- Manual verification: See events in Simple Analytics dashboard

**Why this first:** Need baseline validation that people are using the product before diving into feature-specific metrics.

---

### **Slice 2: Feature Adoption - What Are Users Actually Building?**

**Value for you (Paul):** Understand which core features are being used so you can prioritize development effort

**What gets delivered:**
- Context creation tracking (`context_added`)
- Relationship creation tracking (`relationship_created` with DDD pattern type metadata)
- Group creation tracking (`group_created`)
- Repo assignment tracking (`repo_assigned`/`repo_unassigned`)
- Project complexity metadata attached to events:
  - `project_size`: '1-5' | '6-15' | '16-30' | '31+' (context count)
  - `relationship_count`: '0-5' | '6-15' | '16+'
  - `has_groups`: boolean
  - `has_repo_assignments`: boolean

**Questions answered in Simple Analytics dashboard:**
1. "Are users creating relationships or just contexts?"
2. "Which DDD patterns are most used?" (customer-supplier vs. conformist vs. ACL, etc.)
3. "Is the grouping feature being used?"
4. "Is repo assignment valuable enough to keep?"
5. "What's typical project size: toy projects or real architecture?"
6. "Are projects simple (few contexts) or complex?"

**Testing:**
- Integration tests: Store actions trigger correct events with metadata
- Manual verification: Dashboard shows feature adoption patterns

**Why this second:** Once you know people are using the app, need to understand WHAT they're building to prioritize features.

---

### **Slice 3: Onboarding Success - Are New Users Getting Started?**

**Value for you (Paul):** Identify onboarding friction and drop-off points to improve first-time experience

**What gets delivered:**
- FTUE milestone events (tracked via sessionStorage, fire once per session):
  - `first_context_added` - Core FTUE success
  - `first_relationship_added` - Understanding DDD patterns
  - `first_group_created` - Advanced feature discovery
  - `second_view_discovered` - Multi-view workflow adoption
- Timing metrics:
  - `time_to_first_context` (seconds from page load)
- Project start tracking:
  - `sample_project_loaded` with `{sample: 'acme' | 'cbioportal' | 'empty' | 'elan'}`
  - `empty_start`: boolean (started with blank project)

**Questions answered in Simple Analytics dashboard:**
1. "What % of visitors add their first context?" (FTUE success rate)
2. "How long does it take to get started?" (time-to-first-context)
3. "Do users start with sample projects or blank canvas?"
4. "Which sample project is most popular?"
5. "Do users discover relationships after creating contexts?"
6. "Do users discover advanced features like grouping?"
7. "Are users exploring multiple views or sticking to one?"

**Testing:**
- Unit tests: Milestone tracking logic (only fires once)
- Integration tests: Events fire correctly on first occurrence
- Manual verification: Dashboard shows onboarding funnel

**Why this third:** After understanding feature adoption overall, need to see where NEW users get stuck or drop off.

---

### **Slice 4: Power Users - Advanced Features & Retention**

**Value for you (Paul):** Identify power users, validate advanced feature investment, and understand retention

**What gets delivered:**
- Temporal evolution tracking:
  - `keyframe_created`
  - `timeline_scrubbed` (time slider interaction)
- Project persistence tracking:
  - `project_imported`
  - `project_exported`
- Workflow pattern tracking:
  - `undo_used`
  - `redo_used`
- Retention signals:
  - `return_visit` (localStorage indicates previous session)
  - `project_complexity_grown` (project evolved since last session)
  - `multi_session_detected` (active editing across multiple sessions)

**Questions answered in Simple Analytics dashboard:**
1. "Is temporal evolution being used?" (justify the complexity investment)
2. "Are users exporting projects?" (intent to save/share)
3. "Are users importing projects?" (collaboration or migration patterns)
4. "How often do users undo/redo?" (trial-and-error vs. confident workflow)
5. "Are people coming back?" (return visit rate)
6. "Do projects evolve over time?" (complexity growth)
7. "Are there multi-session power users?"

**Testing:**
- Integration tests: Events fire for advanced features
- Integration tests: Retention signals with mocked localStorage
- Manual verification: Dashboard shows power user patterns

**Why this fourth:** Once core features and onboarding are validated, need to understand retention and whether advanced features justify their complexity.

---

## Implementation Strategy

### **Phase 1: Validation (Slice 1)**
Prove people are using the product and which views they prefer

### **Phase 2: Prioritization (Slice 2)**
Understand feature adoption to guide development roadmap

### **Phase 3: Optimization (Slice 3)**
Improve onboarding based on where users get stuck

### **Phase 4: Growth (Slice 4)**
Identify power users and retention patterns

---

## Technical Implementation Details

### **Project-Level Identification Strategy**

**How It Works (Like EventCatalog's Catalog IDs):**

**EventCatalog Model:**
- One catalog → One `cId` (UUID in config file)
- Multiple developers → Share same `cId`
- Tracks catalogs, not people

**ContextFlow Model:**
- One project → One `project.id` (UUID in data model)
- Multiple users on same project → Share same project ID
- Tracks projects, not people

**Example Event Metadata:**
```typescript
{
  deployment: 'localhost',
  project_id: 'proj_a3k9m2',  // Hashed project.id
  project_size: '16-30',
  relationship_count: '6-15',
  has_groups: true,
  has_temporal: false,
  app_version: '0.2.0',
  view: 'flow'  // Event-specific metadata
}
```

### **Key Helper Functions:**

```typescript
function getDeploymentContext(): 'hosted_demo' | 'self_hosted' | 'localhost' {
  const hostname = window.location.hostname
  if (hostname === 'contextflow.virtualgenius.com') return 'hosted_demo'
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost'
  return 'self_hosted'
}

function hashProjectId(id: string): string {
  // Simple hash for anonymization
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }
  return `proj_${Math.abs(hash).toString(36).substring(0, 8)}`
}

function categorizeSize(count: number): string {
  if (count === 0) return '0'
  if (count <= 5) return '1-5'
  if (count <= 15) return '6-15'
  if (count <= 30) return '16-30'
  return '31+'
}

function getProjectMetadata() {
  const activeProject = useEditorStore.getState().activeProject
  if (!activeProject) return null

  return {
    project_id: hashProjectId(activeProject.id),
    project_size: categorizeSize(activeProject.contexts.length),
    relationship_count: categorizeSize(activeProject.relationships.length),
    has_groups: activeProject.groups.length > 0,
    has_repo_assignments: activeProject.repos.some(r => r.contextId),
    has_temporal: activeProject.temporal?.enabled || false
  }
}

function isAnalyticsEnabled(): boolean {
  // Check for developer mode opt-out
  const isDeveloper = localStorage.getItem('contextflow.developer_mode') === 'true'
  return !isDeveloper
}

function trackEvent(eventName: string, metadata?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return

  try {
    const globalMetadata = {
      deployment: getDeploymentContext(),
      app_version: '0.2.0', // from package.json
      ...getProjectMetadata()
    }

    const fullMetadata = { ...globalMetadata, ...metadata }

    if (typeof window.sa_event === 'function') {
      window.sa_event(eventName, fullMetadata)
    }
  } catch (error) {
    // Silent failure - never break the app
    console.warn('Analytics error:', error)
  }
}
```

---

## Scenarios: How This Solves the "5 Localhost Users" Problem

### **Scenario A: 5 Different Users, Each Create New Projects**
- Person 1 creates "My E-commerce" → `project_id: 'proj_abc123'`
- Person 2 creates "Banking System" → `project_id: 'proj_def456'`
- Person 3-5 create their own → `'proj_ghi789'`, `'proj_jkl012'`, `'proj_mno345'`
- **Result:** All distinguishable in dashboard ✅

### **Scenario B: 5 Different Users, All Load Sample Project**
- All 5 load `examples/sample.project.json`
- All share same project ID → `project_id: 'proj_sample'`
- **Result:** Aggregated together (can't distinguish) ✅
- **This is correct:** Like EventCatalog team working on same catalog

### **Scenario C: Paul Testing vs. Real Users**
- You (testing): Set developer mode → No events tracked
- User 1: Creates "Real Project A" → `project_id: 'proj_real_a'`
- User 2: Creates "Real Project B" → `project_id: 'proj_real_b'`
- **Result:** Your testing doesn't pollute data ✅

### **Developer Mode (Opt-Out):**

```typescript
// In browser console (once per browser):
localStorage.setItem('contextflow.developer_mode', 'true')

// Now analytics are disabled completely in this browser
```

---

## Privacy & Compliance

### **Simple Analytics Compliance:**

**What we track (COMPLIANT):**
- ✅ Project IDs (identifies projects, not people - like EventCatalog's `cId`)
- ✅ Deployment context (categorized: hosted_demo/self_hosted/localhost)
- ✅ Feature usage (booleans and counts)
- ✅ Aggregate metrics (project size, relationship counts)

**What we DON'T track (PII):**
- ❌ User-entered text (project names, context names, descriptions)
- ❌ Actual hostnames (for self-hosted/localhost)
- ❌ Session IDs or browser fingerprints
- ❌ User identifiers or personal information

**Why Project IDs Are Compliant:**
- Like EventCatalog's catalog IDs (proven pattern)
- Multiple users can share same project ID (not 1:1 with people)
- Identifies "things" (projects), not "people" (users)
- Hashed for additional privacy layer
- Simple Analytics terms allow this (not personal data)

### **User Privacy Safeguards:**
- Silent failures (never blocks app)
- Respects browser DNT headers (Simple Analytics does this automatically)
- Developer mode opt-out via localStorage flag
- No cookies, no persistent user tracking
- Project IDs are anonymized via hashing

---

## Testing Strategy

### **Use TDD for:**
1. ✅ [src/utils/analytics.ts](../src/utils/analytics.ts) - Pure functions, easy to mock
2. ✅ Deployment context detection
3. ✅ Project ID hashing and categorization
4. ✅ Project complexity calculations
5. ✅ Milestone tracking logic (fire once per session)

### **Use Traditional Testing for:**
1. ⚠️ Store integration (add tracking calls to existing actions)
2. ⚠️ HTML script tag setup
3. ⚠️ Dashboard verification (manual)

### **Test Coverage Goal:**
- 100% coverage for analytics utility
- Integration tests for all tracked events
- Manual verification for dashboard data

---

## Dependencies & Risks

**Dependencies:**
- Simple Analytics account configured for `contextflow.virtualgenius.com`
- No npm packages needed (script-only)

**Risks:**
- **Low:** Simple Analytics API is stable and simple
- **Mitigation:** Silent failures ensure app never breaks
- **Testing limitation:** Can't test against real Simple Analytics in CI (mock in tests)
- **Compliance:** Project IDs follow EventCatalog's proven pattern (low risk)

---

## Success Metrics (Questions Answered)

### **After Slice 1 (Product Validation):**
- How many people are visiting?
- Which deployment type is most common?
- Which view (Flow/Strategic/Distillation) is preferred?

### **After Slice 2 (Feature Adoption):**
- Which features are actually used?
- Which DDD patterns are most popular?
- What's typical project complexity?
- Is repo assignment worth keeping?

### **After Slice 3 (Onboarding):**
- What % of visitors complete FTUE?
- Where do users drop off?
- Do users start with samples or blank projects?
- How long to get started?

### **After Slice 4 (Power Users):**
- Are advanced features (temporal) worth the complexity?
- Are users coming back?
- Do projects evolve over time?
- What's the retention rate?

---

## Key Design Decisions

### **Changed from Original Plan:**
1. **Consolidated 8 slices into 4** - Each delivers actionable insights, not just infrastructure
2. **Reordered by urgency** - Validation → Prioritization → Onboarding → Retention
3. **Analytics enabled for localhost** - Captures all usage, project IDs distinguish users
4. **Project-level identifiers** - Mirrors EventCatalog's catalog ID pattern (privacy-compliant)

### **Unchanged:**
- Simple Analytics (no additional tools)
- Privacy-first approach (no PII)
- Silent error handling (never breaks app)
- TDD for utility functions
- Integration tests for store actions

---

## References

- **EventCatalog approach:** Server-side CLI telemetry with catalog-level IDs (`cId`)
- **EventCatalog config:** Uses `cId` (UUID) + `organizationName` to identify catalogs (not users)
- **Simple Analytics docs:** https://docs.simpleanalytics.com/events
- **Simple Analytics metadata:** https://docs.simpleanalytics.com/metadata
- **Simple Analytics restrictions:** No personal data, no user identifiers in metadata
- **ContextFlow data model:** [src/model/types.ts](../src/model/types.ts) - Project already has `id` field
- **ContextFlow store:** [src/model/store.ts](../src/model/store.ts)
