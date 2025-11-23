# Analytics Usage Guide

Practical guide for using Simple Analytics dashboard to track ContextFlow user behavior.

## The Core Issue

Your analytics plan has all 5 slices implemented (Product Validation, Feature Adoption, Onboarding, Power Users, View-Specific Features), tracking ~60+ different event types with rich metadata. That's why the field list is overwhelming!

**Solution:** Focus on a few key reports for daily monitoring. Use exports for deep journey analysis.

---

## Recommended Starter Reports

### Report 1: New User Funnel (FTUE Success)
**Goal:** Track first-time user experience milestones

**Events to filter:**
- `sample_project_loaded`
- `first_context_added`
- `first_relationship_added`
- `inspector_panel_opened`
- `view_switched`

**Metadata columns to add:**
- `time_since_load_seconds` (shows time to first action)
- `sample` (which sample did they load?)
- `project_origin` (sample/empty/imported)

**What this tells you:**
- What % of visitors add their first context (FTUE success rate)?
- How long does it take to get started?
- Which sample project is most popular?
- Are users exploring inspector details?

---

### Report 2: Exploration Patterns
**Goal:** Understand how new users explore the app

**Events to filter:**
- `sample_project_loaded`
- `sample_project_modified`
- `view_switched`
- `second_view_discovered`

**Metadata columns:**
- `sample` (ACME/cbioportal/elan/empty)
- `modification_type` (context_added/edited/relationship_added)
- `views_used` (array showing which views they tried)
- `to_view` (which view they switched to)

**What this tells you:**
- Do users start with samples or blank canvas?
- Do users modify samples or just view them?
- Which views do new users discover first?

---

### Report 3: Project Engagement Overview
**Goal:** See project-level activity (all users, including returning)

**Group by:** `project_id`

**Aggregate metrics to show:**
- `context_count` (average or max per project)
- `relationship_count`
- `group_count`
- `deployment` (hosted_demo/self_hosted/localhost)
- Count of events per project

**What this tells you:**
- Are users creating toy projects (few contexts) or real architecture?
- Which projects are "sample" vs "continued" vs "empty"?
- How many distinct projects exist?

---

### Report 4: Feature Adoption Snapshot
**Goal:** Which features are being used?

**Event name filter:**
- `feature_first_used`

**Metadata columns:**
- `feature` (relationships/groups/repo_assignment/external_contexts)
- `context_count` (project complexity when feature was first used)
- `project_id` (to count how many unique projects use each feature)

**What this tells you:**
- Which features are actually used?
- Is repo assignment valuable enough to keep?
- Are external contexts being used correctly?

---

## How to Track First-Time Users

**Question:** "Someone is trying contextflow.virtualgenius.com for the first time. How would I know, and what could I do to figure out how they are using the app?"

### Step 1: Filter to new visitors
**Filter:** `project_origin = 'sample'` (most first-timers load a sample)
**or** `Event name = 'sample_project_loaded'`

### Step 2: Track their journey
For a specific project, filter by `project_id` (e.g., `proj_009ldawd`), then:

1. **Sort by timestamp** to see chronological flow
2. **Look for FTUE milestones:**
   - Did `first_context_added` fire? (Success!)
   - Did `first_relationship_added` fire? (Understanding DDD patterns)
   - Did `second_view_discovered` fire? (Multi-view workflow adoption)

3. **Check metadata:**
   - `time_since_load_seconds` - How long before they took action?
   - `modification_type` - What did they do first?
   - `sample` - Which sample are they exploring?

### Step 3: Identify drop-off points
**Create a funnel:**
1. `sample_project_loaded` → baseline
2. `inspector_panel_opened` → engaged with details?
3. `sample_project_modified` → actively editing?
4. `first_context_added` → creating their own work?

Drop-off rate = (step N count / step 1 count) shows where users get stuck.

---

## Simplifying the Field List

The "Add a column" dropdown is overwhelming because your analytics plan tracks detailed metadata for export analysis. Here's how to focus:

### Fields you'll use most often (start here):
- `project_id` - Track individual projects
- `project_origin` - sample/empty/imported/continued
- `deployment` - hosted_demo/self_hosted/localhost
- `app_version` - Track version usage
- `context_count` - Project complexity
- `relationship_count` - Feature adoption signal
- `sample` - Which sample loaded
- `time_since_load_seconds` - FTUE timing

### Fields for specific questions only:
- `actor_count`, `need_count`, `keyframe_count` - Only when analyzing those features
- `repo_assignment_count`, `person_count`, `team_count` - Only for repo/team adoption questions
- `from_view`, `to_view` - Only for view-switching analysis

---

## Simple Analytics Limitations

**Problem:** Simple Analytics **cannot reconstruct individual user journeys** in the dashboard. You can see:
- ✅ Event counts and aggregates
- ✅ Filters by metadata
- ✅ Trends over time

But you **cannot** easily see:
- ❌ "Show me all events for project X in chronological order"
- ❌ "What happened after sample_project_loaded?"
- ❌ Multi-step funnels with drop-off rates

### Solution: Export for journey analysis
When you need to answer "How did user X flow through the app?":

1. **Download CSV** from Events Explorer
2. **Filter by project_id** in spreadsheet/Python
3. **Sort by timestamp** to see chronological sequence
4. **Calculate funnels** manually (% who go from step A → B → C)

This is exactly what your analytics plan calls out:
> "**Detailed events** (for future deep analysis via exports) and **summary events** (for immediate dashboard insights)."

---

## Recommended Starting Point

### Today (to answer your question):
1. Create **Report 1: New User Funnel** (focus on FTUE milestones)
2. Filter to `deployment = 'hosted_demo'` (public visitors only)
3. Look at counts for:
   - `sample_project_loaded` (baseline)
   - `first_context_added` (FTUE success)
   - `first_relationship_added` (understanding DDD)

### This week:
- Export CSV for one project (`proj_009ldawd` or similar)
- Sort by timestamp in Excel/Google Sheets
- See the actual journey: what did they do first? second? third?

**Why this matters:** Once you see 2-3 real user journeys, you'll know which dashboard reports are most valuable for daily monitoring.

---

## See Also

- [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) - Implementation strategy and event catalog
- Simple Analytics Events Explorer - Main dashboard interface
