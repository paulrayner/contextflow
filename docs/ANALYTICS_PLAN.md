# Analytics Implementation Plan for ContextFlow

## Scope: Enable usage tracking to guide product decisions as a solo founder

**Goal:** Track how end-users interact with ContextFlow so you (Paul) can validate product-market fit, prioritize features, and improve onboarding. Analytics provides actionable insights in Simple Analytics dashboard.

**Key Decision:** Use **project-level identifiers** (like EventCatalog's catalog IDs) to distinguish different projects while respecting user privacy.

**Perspective:** You are the **user** of this analytics system. Simple Analytics dashboard is your **UI**. Each slice delivers insights you can act on.

**Approach:** Track both **detailed events** (for future deep analysis via exports) and **summary events** (for immediate dashboard insights). Simple Analytics handles all event types; exports enable complex analysis when needed.

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
- Project lifecycle tracking:
  - `project_opened` - When user loads/creates a project
  - `project_closed` - When user navigates away or closes tab
- View switching events (`view_switched` with metadata)
- Global metadata on all events:
  - `deployment`: Where app is running
  - `app_version`: Package version
  - `project_id`: Hashed project ID
  - `project_origin`: 'sample' | 'empty' | 'imported' | 'continued'

**Questions answered in Simple Analytics dashboard:**
1. "How many people are visiting?" (page views)
2. "Which deployment type: hosted demo, self-hosted, or localhost?"
3. "Which view is most popular: Flow, Strategic, or Distillation?"
4. "Is Distillation view even worth the complexity?"
5. "How many distinct projects are being created?"
6. "What's the average session duration per project?"
7. "Do users work on one project or explore multiple samples?"

**Testing:**
- TDD: Unit tests for analytics utility (deployment context, project ID hashing)
- Integration test: View switching triggers correct events
- Integration test: Project lifecycle events fire on open/close
- Manual verification: See events in Simple Analytics dashboard

**Why this first:** Need baseline validation that people are using the product before diving into feature-specific metrics.

---

### **Slice 2: Feature Adoption - What Are Users Actually Building?**

**Value for you (Paul):** Understand which core features are being used so you can prioritize development effort

**What gets delivered:**

**Detailed events (for export analysis):**
- `context_added` - Track context creation with full metadata
  - `entity_type`: 'context'
  - `entity_id`: context ID
  - `source_view`: 'flow' | 'strategic'
  - `metadata`: { `context_type`: 'core' | 'supporting' | 'generic', `is_external`: boolean }
- `context_deleted` - Track deletions
  - `metadata`: { `relationship_count`: number, `group_count`: number }
- `context_property_changed` - Track all property edits
  - `property_changed`: 'name' | 'purpose' | 'strategicClassification' | 'evolutionStage' | 'isExternal'
  - `old_value`: previous value
  - `new_value`: updated value
  - `source_view`: where change was made
- `relationship_added` - Track relationship creation
  - `metadata`: { `pattern`: DDD pattern type, `from_context_id`: string, `to_context_id`: string }
- `relationship_pattern_changed` - Track pattern modifications
  - `old_value`: previous pattern
  - `new_value`: new pattern
- `relationship_deleted` - Track deletions
  - `metadata`: { `pattern`: string, `from_context_id`: string, `to_context_id`: string }
- `group_created` - Track group creation
  - `metadata`: { `initial_member_count`: number }
- `group_deleted` - Track group deletions
  - `metadata`: { `member_count`: number }
- `context_added_to_group` - Track group membership
  - `metadata`: { `group_id`: string, `method`: 'drag' | 'drawn_around' | 'inspector' }
- `context_removed_from_group` - Track removal
  - `metadata`: { `group_id`: string, `remaining_member_count`: number }

**People & Teams:**
- `person_added` (detailed)
  - `entity_type`: 'person'
  - `entity_id`: person ID
  - `metadata`: { `has_email`: boolean, `email_count`: number, `team_count`: number }
- `person_deleted` (detailed)
  - `metadata`: { `team_count`: number, `contributor_to_repo_count`: number }
- `person_assigned_to_team` (detailed)
  - `metadata`: { `team_id`: string, `person_team_count_after`: number }
- `person_removed_from_team` (detailed)
  - `metadata`: { `team_id`: string, `person_team_count_after`: number }
- `team_added` (detailed)
  - `entity_type`: 'team'
  - `entity_id`: team ID
  - `metadata`: { `topology_type`: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown', `has_jira_board`: boolean, `member_count`: number }
- `team_deleted` (detailed)
  - `metadata`: { `member_count`: number, `assigned_repo_count`: number }
- `team_topology_changed` (detailed)
  - `property_changed`: 'topologyType'
  - `old_value`: topology type | null
  - `new_value`: topology type
- `contributor_added_to_repo` (detailed)
  - `metadata`: { `repo_has_url`: boolean, `repo_team_count`: number, `repo_contributor_count_after`: number }
- `contributor_removed_from_repo` (detailed)
  - `metadata`: { `repo_contributor_count_after`: number }

**Repos:**
- `repo_added` (detailed)
  - `entity_type`: 'repo'
  - `entity_id`: repo ID
  - `metadata`: { `has_remote_url`: boolean, `url_platform`: 'github' | 'gitlab' | 'bitbucket' | 'other' | null, `team_count`: number, `contributor_count`: number }
- `repo_deleted` (detailed)
  - `metadata`: { `was_assigned_to_context`: boolean, `had_teams`: boolean, `had_contributors`: boolean }
- `repo_url_added` (detailed)
  - `property_changed`: 'remoteUrl'
  - `metadata`: { `platform`: 'github' | 'gitlab' | 'bitbucket' | 'other' }
- `repo_url_removed` (detailed)
  - `metadata`: { `had_platform`: 'github' | 'gitlab' | 'bitbucket' | 'other' }
- `repo_assigned` / `repo_unassigned` - Track repo assignments

**Context Additional Properties:**
- `context_boundary_integrity_changed` (detailed)
  - `property_changed`: 'boundaryIntegrity'
  - `old_value`: 'strong' | 'moderate' | 'weak' | null
  - `new_value`: 'strong' | 'moderate' | 'weak'
  - `source_view`: 'flow' | 'strategic' | 'inspector'
- `context_code_size_changed` (detailed)
  - `property_changed`: 'codeSize.bucket'
  - `old_value`: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | null
  - `new_value`: 'tiny' | 'small' | 'medium' | 'large' | 'huge'
- `context_legacy_flag_changed` (detailed)
  - `property_changed`: 'isLegacy'
  - `old_value`: boolean
  - `new_value`: boolean

**Text Field Editing (PII-safe - char counts only):**
- `text_field_edited` (detailed)
  - `entity_type`: 'context' | 'relationship' | 'group' | 'actor' | 'need' | 'team'
  - `field_name`: 'purpose' | 'notes' | 'boundaryNotes' | 'description' | 'communicationMode'
  - `old_char_count`: number
  - `new_char_count`: number
  - `edit_type`: 'added_text' | 'deleted_text' | 'replaced_text' | 'cleared'
  - `source`: 'inspector' | 'overlay'

**Summary events (for dashboard queries):**
- `feature_first_used` - First use of major features
  - `feature`: 'relationships' | 'groups' | 'repo_assignment' | 'external_contexts'
- `project_complexity_increased` - When project grows
  - `from_context_count`: number
  - `to_context_count`: number
  - `contexts_added`: number (delta)

**Project complexity metadata (attached to all events):**
  - `context_count`: number
  - `relationship_count`: number
  - `group_count`: number
  - `repo_assignment_count`: number
  - `has_temporal`: boolean

**Questions answered in Simple Analytics dashboard:**
1. "Are users creating relationships or just contexts?"
2. "Which DDD patterns are most used?" (customer-supplier vs. conformist vs. ACL, etc.)
3. "Is the grouping feature being used?"
4. "Is repo assignment valuable enough to keep?"
5. "What's typical project size: toy projects or real architecture?"
6. "Are projects simple (few contexts) or complex?"
7. "Which properties do users edit most often?"
8. "Are external contexts being used correctly?"
9. "Are users managing people and teams?"
10. "Which Team Topology types are most common?"
11. "What % of repos have GitHub/GitLab URLs?"
12. "Do users understand boundary integrity (strong/moderate/weak)?"
13. "Are users documenting relationship communication modes?"
14. "What % of contexts are marked as legacy?"
15. "Which text fields get the most content (by char count)?"

**Testing:**
- Integration tests: Store actions trigger correct events with metadata
- Integration tests: Summary events fire on first feature use
- Manual verification: Dashboard shows feature adoption patterns

**Why this second:** Once you know people are using the app, need to understand WHAT they're building to prioritize features.

---

### **Slice 3: Onboarding Success - Are New Users Getting Started?**

**Value for you (Paul):** Identify onboarding friction and drop-off points to improve first-time experience

**What gets delivered:**

**Detailed events (for journey reconstruction):**
- `sample_project_loaded` - When user opens a sample
  - `sample`: 'acme' | 'cbioportal' | 'elan' | 'empty'
  - `contexts_count`: number
  - `relationships_count`: number
- `sample_project_modified` - First edit to loaded sample
  - `sample_origin`: 'acme' | 'cbioportal' | 'elan'
  - `modification_type`: 'context_added' | 'context_edited' | 'relationship_added'
  - `time_since_load_seconds`: number
- `project_personalized` - Changed project name from sample default
  - `from_sample`: 'acme' | 'cbioportal' | 'elan' | null
- `inspector_panel_opened` - First time opening inspector
  - `entity_type`: 'context' | 'relationship' | 'group'
  - `time_since_load_seconds`: number
- `empty_project_started` - Started with blank canvas
- `sample_cleared_for_fresh_start` - Deleted all contexts after loading sample
  - `sample`: string
  - `contexts_deleted`: number

**FTUE milestone events** (fire once per browser session via sessionStorage flag):
  - `first_context_added` - Core FTUE success
    - `time_since_load_seconds`: number
  - `first_relationship_added` - Understanding DDD patterns
  - `first_group_created` - Advanced feature discovery
  - `second_view_discovered` - Multi-view workflow adoption
    - `views_used`: array of view names

**Summary events (for dashboard funnel analysis):**
- `onboarding_milestone_reached`
  - `milestone`: 'loaded_sample' | 'modified_sample' | 'created_own_project' | 'exported_first_project'
  - `time_since_start_seconds`: number
- `exploration_pattern_detected`
  - `pattern`: 'sample_explorer' | 'sample_modifier' | 'blank_starter' | 'multi_sample_comparer'

**Questions answered in Simple Analytics dashboard:**
1. "What % of visitors add their first context?" (FTUE success rate)
2. "How long does it take to get started?" (time-to-first-context)
3. "Do users start with sample projects or blank canvas?"
4. "Which sample project is most popular?"
5. "Do users modify samples or just view them?"
6. "Do users transition from sample → personalized project?"
7. "Are users reading inspector details or visual-first?"
8. "Which exploration pattern is most common?" (view → modify → own project)
9. "Where do users drop off in the onboarding journey?"

**Testing:**
- Unit tests: Milestone tracking logic (only fires once per browser session)
- Integration tests: Events fire correctly on first occurrence
- Integration tests: Journey events track sample exploration → modification → personalization
- Manual verification: Dashboard shows onboarding funnel

**Why this third:** After understanding feature adoption overall, need to see where NEW users get stuck or drop off. Critical for users migrating from tools like Miro or other visual mapping solutions.

---

### **Slice 4: Power Users - Advanced Features & Retention**

**Value for you (Paul):** Identify power users, validate advanced feature investment, and understand retention

**What gets delivered:**

**Detailed events (for feature usage analysis):**
- `project_imported` - User imports external project
  - `file_size_kb`: number
  - `context_count`: number
  - `relationship_count`: number
  - `group_count`: number
  - `keyframe_count`: number
  - `actor_count`: number
  - `need_count`: number
- `project_exported` - User exports project
  - `format`: 'json' | 'png' | 'svg'
  - `context_count`: number
  - `relationship_count`: number
  - `group_count`: number
  - `current_view`: 'flow' | 'strategic' | 'temporal' | 'distillation' | 'wardley'
- `undo_used` / `redo_used` - Workflow patterns
  - `action_undone`: 'context_added' | 'relationship_deleted' | etc.
- `layout_algorithm_used` - Auto-layout features
  - `view`: 'flow' | 'strategic'
  - `context_count`: number

**Canvas Interactions:**
- `canvas_zoomed` (detailed)
  - `zoom_level`: number
  - `direction`: 'in' | 'out'
  - `method`: 'scroll' | 'button' | 'pinch'
  - `context_count`: number
- `canvas_panned` (detailed)
  - `interaction`: 'drag' | 'keyboard'
  - `distance_pixels`: number (approximate)
- `fit_to_map_used` (detailed)
  - `context_count`: number
  - `viewport_coverage_before_percent`: number
  - `zoom_level_before`: number
- `context_dragged` (detailed)
  - `entity_type`: 'context'
  - `view`: 'flow' | 'strategic' | 'distillation' | 'wardley'
  - `distance_pixels`: number
  - `axis`: 'horizontal' | 'vertical' | 'both'
  - `drag_duration_ms`: number

**Selection & Highlighting:**
- `entity_selected` (detailed)
  - `entity_type`: 'context' | 'relationship' | 'group' | 'actor' | 'need'
  - `view`: 'flow' | 'strategic' | 'distillation' | 'wardley' | 'temporal'
  - `highlighted_entity_count`: number
  - `connection_chain_length`: 1 | 2
- `multi_select_used` (detailed)
  - `entity_count`: number
  - `entity_types`: array
  - `followed_by`: 'group_create' | 'deselect' | null
  - `selection_method`: 'shift_click' | 'drag_select' | 'cmd_click'

**Overlay Usage:**
- `relationship_create_overlay_opened` (detailed)
  - `from_context_type`: 'core' | 'supporting' | 'generic'
  - `to_context_type`: 'core' | 'supporting' | 'generic'
  - `from_is_external`: boolean
  - `to_is_external`: boolean
- `relationship_create_overlay_completed` (detailed)
  - `pattern_chosen`: DDD pattern type
  - `time_open_seconds`: number
  - `added_communication_mode`: boolean
  - `added_description`: boolean
- `relationship_create_overlay_cancelled` (detailed)
  - `time_open_seconds`: number
- `group_create_overlay_opened` (detailed)
  - `selected_context_count`: number
- `group_create_overlay_completed` (detailed)
  - `member_count`: number
  - `time_open_seconds`: number
  - `added_notes`: boolean
  - `chose_color`: boolean
- `group_create_overlay_cancelled` (detailed)
  - `time_open_seconds`: number
- `group_opacity_adjusted` (detailed)
  - `old_value`: number (0-100)
  - `new_value`: number (0-100)
  - `interaction`: 'slider' | 'keyboard'

**Project Management:**
- `project_list_viewed` (detailed)
  - `saved_project_count`: number
  - `most_recent_project_age_days`: number
- `project_switched` (detailed)
  - `from_project_id`: string
  - `to_project_id`: string
  - `via`: 'project_list' | 'direct_import'
- `project_created_from_scratch` (detailed)
  - `template`: 'empty' | 'sample_acme' | 'sample_cbioportal' | 'sample_elan'
- `project_deleted_locally` (detailed)
  - `project_id`: string
  - `context_count`: number
  - `relationship_count`: number
  - `age_days`: number
- `project_renamed` (detailed)
  - `name_char_count`: number
  - `project_age_days`: number

**Undo/Redo Enhancement:**
- `undo_chain_executed` (detailed)
  - `steps_in_sequence`: number
  - `total_duration_seconds`: number
  - `action_types`: array of action types undone
- `redo_after_undo` (detailed)
  - `time_since_undo_seconds`: number
  - `steps_redone`: number

**Autosave & Storage:**
- `autosave_triggered` (detailed)
  - `change_type`: 'context_edit' | 'relationship_add' | 'group_move' | 'property_change'
  - `storage_type`: 'localStorage' | 'indexedDB'
  - `project_size_kb`: number
- `autosave_failed` (detailed)
  - `error_type`: 'quota_exceeded' | 'permission_denied' | 'storage_unavailable' | 'other'
  - `storage_size_kb`: number
  - `project_count`: number
- `storage_quota_warning` (detailed)
  - `used_percent`: number
  - `project_count`: number
  - `total_size_kb`: number

**Retention tracking:**
- `return_visit_detected` - User came back (localStorage check)
  - `days_since_last_visit`: number
  - `same_project_continued`: boolean
  - `project_id`: string (to correlate)
- `project_evolution_detected` - Project grew since last session
  - `context_count_change`: number (delta)
  - `new_features_used`: array

**Summary events (for dashboard):**
- `engagement_level_detected`
  - `level`: 'casual' | 'active' | 'power_user'
  - `signals`: array of ['multi_session', 'export', 'advanced_features', 'large_project']
  - `context_count`: number
  - `session_count`: number
- `export_intent_signal` - High-value action
  - `context_count`: number
  - `time_before_export_minutes`: number

**Questions answered in Simple Analytics dashboard:**
1. "Are users exporting projects?" (serious usage signal)
2. "What triggers exports?" (project size, features used, time spent)
3. "Are users importing projects?" (collaboration patterns)
4. "How often do users undo/redo?" (trial-and-error vs. confident workflow)
5. "Are people coming back?" (return visit rate)
6. "Do projects evolve over time?" (complexity growth across sessions)
7. "Are there multi-session power users?"
8. "Which features correlate with exports?" (proxy for value)
9. "What distinguishes power users from casual users?"
10. "Do large projects (30+ contexts) struggle with navigation?" (zoom/pan/fit usage)
11. "Is multi-select → group creation flow intuitive?"
12. "How often are creation overlays abandoned?" (completion vs cancellation rate)
13. "Do users manage multiple projects or just one?"
14. "Are users hitting browser storage limits?"
15. "Is the 2-hop connection highlighting feature being used?"
16. "Which overlay takes longest to complete?" (UX friction indicator)

**Testing:**
- Integration tests: Events fire for advanced features
- Integration tests: Retention signals with mocked localStorage
- Integration tests: Export events include full feature usage context
- Manual verification: Dashboard shows power user patterns

**Why this fourth:** Once core features and onboarding are validated, need to understand retention and whether advanced features justify their complexity.

---

### **Slice 5: View-Specific Features - Domain Distillation, Wardley, Temporal, Actors**

**Value for you (Paul):** Validate investment in advanced strategic views and understand how users apply DDD/Wardley concepts

**What gets delivered:**

**Domain Distillation View:**
- `context_domain_classification_changed` (detailed)
  - `entity_type`: 'context'
  - `entity_id`: context ID
  - `property_changed`: 'strategicClassification'
  - `old_value`: 'core' | 'supporting' | 'generic' | null
  - `new_value`: 'core' | 'supporting' | 'generic'
  - `source_view`: 'distillation'
  - `interaction_type`: 'dropdown' | 'drag_to_zone'
- `distillation_view_engaged` (summary)
  - `classifications_made`: number
  - `time_spent_seconds`: number

**Wardley Evolution View:**
- `context_evolution_stage_changed` (detailed)
  - `property_changed`: 'evolutionStage'
  - `old_value`: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility' | null
  - `new_value`: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility'
  - `source_view`: 'wardley'
  - `interaction_type`: 'horizontal_drag' | 'dropdown'
- `context_value_chain_position_changed` (detailed)
  - `property_changed`: 'wardley_y_position'
  - `old_value`: number (0-100)
  - `new_value`: number (0-100)
  - `interaction_type`: 'vertical_drag'
- `wardley_view_engaged` (summary)
  - `contexts_positioned`: number
  - `evolution_stages_used`: array

**Temporal View:**
- `temporal_keyframe_created` (detailed)
  - `entity_type`: 'keyframe'
  - `entity_id`: keyframe ID
  - `metadata`: { `date`: string, `label`: string, `active_context_count`: number }
- `temporal_keyframe_deleted` (detailed)
  - `metadata`: { `date`: string, `position_count`: number, `active_context_count`: number }
- `context_position_changed_in_keyframe` (detailed)
  - `entity_type`: 'context'
  - `metadata`: { `keyframe_id`: string, `old_x`: number, `old_y`: number, `new_x`: number, `new_y`: number }
- `context_activated_in_keyframe` (detailed)
  - `metadata`: { `keyframe_id`: string, `context_id`: string }
- `context_deactivated_in_keyframe` (detailed)
  - `metadata`: { `keyframe_id`: string, `context_id`: string }
- `temporal_view_engaged` (summary)
  - `keyframes_created`: number
  - `contexts_moved`: number
  - `time_spent_seconds`: number

**Actors & User Needs:**
- `actor_added` (detailed)
  - `entity_type`: 'actor'
  - `entity_id`: actor ID
  - `metadata`: { `name`: string, `type`: 'customer' | 'internal_user' | 'partner' | 'regulator' | 'other' }
- `actor_deleted` (detailed)
  - `metadata`: { `need_count`: number }
- `need_added` (detailed)
  - `entity_type`: 'need'
  - `metadata`: { `actor_id`: string, `need_text`: string }
- `need_deleted` (detailed)
  - `metadata`: { `actor_id`: string, `context_association_count`: number }
- `need_associated_with_context` (detailed)
  - `entity_type`: 'need'
  - `metadata`: { `context_id`: string, `context_name`: string, `interaction_type`: 'drag' | 'click_associate' | 'inspector_link' }
- `need_disassociated_from_context` (detailed)
  - `metadata`: { `context_id`: string, `need_id`: string }
- `actors_view_engaged` (summary)
  - `actors_created`: number
  - `needs_created`: number
  - `associations_made`: number

**Flow Stage Markers:**
- `flow_stage_marker_created` (detailed)
  - `entity_type`: 'flow_stage_marker'
  - `metadata`: { `label_char_count`: number, `position`: number }
- `flow_stage_marker_moved` (detailed)
  - `old_value`: number (position)
  - `new_value`: number (position)
- `flow_stage_marker_deleted` (detailed)
  - `metadata`: { `label_char_count`: number }

**Vertical Positioning (Value Chain Axis):**
- `context_vertical_position_changed` (detailed)
  - `entity_type`: 'context'
  - `entity_id`: context ID
  - `old_y`: number (0-100)
  - `new_y`: number (0-100)
  - `delta`: number
  - `view`: 'flow' | 'strategic' | 'distillation'
  - `positioning_intent`: 'user_facing' | 'enabling' | 'mid_tier'
- `vertical_positioning_pattern_detected` (summary)
  - `user_facing_context_count`: number // Y > 75
  - `enabling_context_count`: number // Y < 25
  - `mid_tier_count`: number // Y 25-75

**Distillation 2D Positioning:**
- `context_distillation_position_changed` (detailed)
  - `entity_type`: 'context'
  - `entity_id`: context ID
  - `old_x`: number (0-100)
  - `old_y`: number (0-100)
  - `new_x`: number (0-100)
  - `new_y`: number (0-100)
  - `also_changed_classification`: boolean

**Questions answered in Simple Analytics dashboard:**
1. "Are users classifying contexts in Distillation view?"
2. "Do users understand Core/Supporting/Generic distinctions?"
3. "Are Wardley evolution stages being used correctly?" (Genesis → Commodity)
4. "Is the value chain positioning intuitive?"
5. "Do users understand the vertical Y-axis (value chain proximity)?"
6. "Are users creating temporal stages to show evolution?"
7. "Which actor types are most common?"
8. "Are users associating needs with contexts meaningfully?"
9. "Which view-specific features justify their complexity?"
10. "Do users who use advanced views export more?"
11. "Is the 2D Distillation view positioning being used thoughtfully?"

**Testing:**
- Integration tests: View-specific property changes trigger correct events
- Integration tests: Summary events fire after meaningful engagement
- Manual verification: Dashboard shows view adoption patterns

**Why this fifth:** After core features and onboarding, need to validate whether advanced strategic views (Distillation, Wardley, Temporal) provide enough value to justify their complexity.

---

## Implementation Strategy

### **Phase 1: Validation (Slice 1)**
Prove people are using the product and which views they prefer
- Project lifecycle tracking (open/close)
- View switching patterns
- Basic usage metrics

### **Phase 2: Prioritization (Slice 2)**
Understand feature adoption to guide development roadmap
- Core CRUD events with detailed metadata
- Property change tracking
- Feature first-use detection

### **Phase 3: Optimization (Slice 3)**
Improve onboarding based on where users get stuck
- Sample exploration journey
- FTUE milestones
- Inspector usage patterns
- Drop-off point identification

### **Phase 4: Growth (Slice 4)**
Identify power users and retention patterns
- Export/import tracking
- Return visits
- Project evolution across sessions
- Engagement level classification

### **Phase 5: Feature Validation (Slice 5)**
Validate advanced view investments (Distillation, Wardley, Temporal, Actors)
- View-specific property changes
- Engagement summaries per view
- Usage patterns for strategic features

---

## Technical Implementation Details

### **Event Structure**

All analytics events follow this structure:

```typescript
interface AnalyticsEvent {
  event_name: string;           // e.g., 'context_added', 'property_changed'
  timestamp: string;             // ISO 8601
  project_id: string;            // Hashed project ID

  // Entity information (when applicable)
  entity_type?: 'context' | 'relationship' | 'group' | 'stage' | 'actor' | 'need';
  entity_id?: string;

  // Change tracking (for property edits)
  property_changed?: string;    // e.g., 'strategicClassification'
  old_value?: any;
  new_value?: any;

  // UI context
  source_view?: 'flow' | 'strategic' | 'distillation' | 'wardley' | 'temporal';
  interaction_type?: string;    // e.g., 'drag', 'dropdown', 'inspector_edit'

  // Additional metadata
  metadata?: Record<string, any>;
}
```

### **Detailed vs. Summary Events**

**Detailed events** capture granular actions for future deep analysis via exports:
- Property changes with old/new values
- Entity-level CRUD operations
- User interaction methods
- Timestamps for journey reconstruction

**Summary events** provide pre-aggregated insights for dashboard queries:
- Milestone achievements (e.g., `onboarding_milestone_reached`)
- Engagement levels (e.g., `engagement_level_detected`)
- Feature adoption signals (e.g., `feature_first_used`)
- Pattern detection (e.g., `exploration_pattern_detected`)

**Why both?** Simple Analytics dashboard excels at filtering/grouping individual events but cannot perform complex joins or cohort analysis. Summary events make common product questions answerable via simple filters, while detailed events enable deeper analysis through data exports.

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
// Detailed event example
{
  event_name: 'context_property_changed',
  timestamp: '2025-01-21T15:32:10Z',
  project_id: 'proj_a3k9m2',  // Hashed project.id
  entity_type: 'context',
  entity_id: 'ctx_xyz789',
  property_changed: 'strategicClassification',
  old_value: 'supporting',
  new_value: 'core',
  source_view: 'distillation',
  interaction_type: 'dropdown',

  // Global metadata attached to all events
  deployment: 'localhost',
  context_count: 18,
  relationship_count: 23,
  group_count: 3,
  repo_count: 15,
  repo_assignment_count: 12,
  repo_with_url_count: 10,
  person_count: 8,
  team_count: 4,
  contributor_count: 12,
  has_temporal: false,
  keyframe_count: 0,
  actor_count: 0,
  need_count: 0,
  actor_need_connection_count: 0,
  need_context_connection_count: 0,
  flow_stage_marker_count: 4,
  app_version: '0.2.0'
}

// Summary event example
{
  event_name: 'distillation_view_engaged',
  timestamp: '2025-01-21T15:35:00Z',
  project_id: 'proj_a3k9m2',
  metadata: {
    classifications_made: 5,
    time_spent_seconds: 180
  },

  // Global metadata
  deployment: 'localhost',
  context_count: 18,
  relationship_count: 23,
  group_count: 3,
  app_version: '0.2.0'
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

function getProjectMetadata() {
  const activeProject = useEditorStore.getState().activeProject
  if (!activeProject) return null

  return {
    project_id: hashProjectId(activeProject.id),
    context_count: activeProject.contexts.length,
    relationship_count: activeProject.relationships.length,
    group_count: activeProject.groups.length,
    repo_count: activeProject.repos.length,
    repo_assignment_count: activeProject.repos.filter(r => r.contextId).length,
    repo_with_url_count: activeProject.repos.filter(r => r.remoteUrl).length,
    person_count: activeProject.people.length,
    team_count: activeProject.teams.length,
    contributor_count: activeProject.repos.reduce((sum, r) => sum + r.contributors.length, 0),
    has_temporal: activeProject.temporal?.enabled || false,
    keyframe_count: activeProject.temporal?.keyframes.length || 0,
    actor_count: activeProject.actors.length,
    need_count: activeProject.userNeeds.length,
    actor_need_connection_count: activeProject.actorNeedConnections.length,
    need_context_connection_count: activeProject.needContextConnections.length,
    flow_stage_marker_count: activeProject.viewConfig.flowStages.length
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

// Helper for tracking property changes
function trackPropertyChange(
  entity: { id: string; type: EntityType },
  property: string,
  oldValue: any,
  newValue: any,
  view: ViewType,
  interactionType?: string
): void {
  trackEvent(`${entity.type}_property_changed`, {
    entity_type: entity.type,
    entity_id: entity.id,
    property_changed: property,
    old_value: oldValue,
    new_value: newValue,
    source_view: view,
    interaction_type: interactionType
  })
}

// Helper for tracking summary events
function trackSummaryEvent(eventName: string, summaryData: Record<string, any>): void {
  trackEvent(eventName, { metadata: summaryData })
}
```

---

## Usage Scenarios: How Project-Level Tracking Works

### **Scenario A: New User Journey (Miro Migrator Pattern)**

**Session 1:**
1. Opens hosted demo → `project_opened` (project_id: 'proj_sample_acme', origin: 'sample')
2. Views Flow view → `view_switched` (to: 'flow')
3. Views Strategic view → `view_switched` (to: 'strategic')
4. Clicks context → `inspector_panel_opened` (entity_type: 'context')
5. Edits context description → `context_property_changed` + `sample_project_modified`
6. Adds new context → `context_added` + `first_context_added` (FTUE milestone)
7. Closes tab → `project_closed` (duration: 900 seconds, modified: true)

**Dashboard insights:**
- Filter: `project_id = 'proj_sample_acme'` shows full journey
- Sample modification rate: 1 modified / 1 loaded = 100%
- Time to first action: 180 seconds
- Exploration pattern: 'sample_modifier'

### **Scenario B: 5 Different Users, Each Create New Projects**
- Person 1 creates "My E-commerce" → `project_id: 'proj_abc123'`
- Person 2 creates "Banking System" → `project_id: 'proj_def456'`
- Person 3-5 create their own → `'proj_ghi789'`, `'proj_jkl012'`, `'proj_mno345'`
- **Result:** All distinguishable in dashboard ✅
- **Query:** Count distinct project_ids = 5 unique projects

### **Scenario C: Multiple Users Load Same Sample**
- All 5 load `examples/sample.project.json`
- All share same project ID → `project_id: 'proj_sample_acme'`
- **Result:** Aggregated together (can't distinguish individual users)
- **This is correct:** Measures sample engagement, not individual users
- **Dashboard shows:** "Sample ACME opened 5 times, modified 3 times"

### **Scenario D: Paul Testing vs. Real Users**
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

## Simple Analytics: Dashboard vs. Data Exports

### **What You Can Do in the Dashboard (No Export Needed)**

**Simple filters and grouping:**
- "How many times was event X triggered?" → Count events
- "Which DDD pattern is most popular?" → Group by `metadata.pattern`
- "Do users prefer Flow or Strategic view?" → Group by `source_view`
- "What's the average project size?" → Average of `context_count` field
- "Are users classifying contexts as Core Domain?" → Filter `new_value = 'core'`
- "Which sample project is loaded most?" → Group by `sample` metadata

**Trend analysis:**
- "Is feature adoption growing week-over-week?" → Group events by week
- "Are more users reaching FTUE milestones?" → Track milestone events over time

**Feature adoption rates:**
- "What % of projects use groups?" → Filter `group_count > 0` / total projects
- "What % of users export projects?" → Count `project_exported` events
- "What's the average number of relationships per project?" → Average of `relationship_count`

### **What Requires Data Export (Complex Analysis)**

**User journey reconstruction:**
- "Show me the sequence of actions for a specific project" → Export, filter by `project_id`, sort by timestamp
- "What do users do after loading a sample?" → Export, sequence events after `sample_project_loaded`

**Cohort analysis:**
- "Do users who modify samples have higher retention?" → Export, group by behavior cohort
- "What % of users return after first visit?" → Export, calculate retention by date cohorts

**Property change patterns:**
- "How often do users change contexts from Supporting → Core?" → Export, filter `old_value` + `new_value` combinations
- "What's the typical evolution path in Wardley view?" → Export, trace `evolutionStage` changes per context

**Feature correlation:**
- "Do users who use Distillation view export more?" → Export, join events by `project_id`
- "Which features predict power user behavior?" → Export, statistical analysis

**Funnel analysis (multi-step):**
- "What % who load sample → modify → export?" → Export, calculate drop-off rates per step

### **Export Strategy**

**When to export:**
- Monthly or quarterly for deep dives
- When launching new features to understand adoption patterns
- When investigating specific hypotheses about user behavior

**How to export:**
```bash
# Simple Analytics provides API access
curl https://simpleanalytics.com/contextflow.virtualgenius.com/export.json?start=2025-01-01&end=2025-03-31 \
  -H "Api-Key: YOUR_API_KEY" > events.json
```

**Analysis tools:**
- **Spreadsheet** (Google Sheets, Excel) - Quick filtering and pivot tables
- **Python + pandas** - Advanced analysis, cohort calculations, funnels
- **SQLite** - Complex joins and aggregations when events.json becomes large

---

## Privacy & Compliance

### **PII Policy: What We Track vs What We Don't**

**✅ SAFE TO TRACK (Not PII):**
- **Counts**: people_count, team_count, repo_count, context_count, relationship_count
- **Boolean flags**: has_email, has_jira_board, has_remote_url, is_external, is_legacy
- **Enum values**: strategicClassification, evolutionStage, boundaryIntegrity, topologyType, DDD patterns
- **Numeric values**: positions (X/Y), zoom_level, char_count, duration_seconds
- **Structural metadata**: team_assignment_count, contributor_count, group_member_count
- **Platform types**: 'github' | 'gitlab' | 'bitbucket' (not full URLs)
- **Hashed IDs**: project_id (hashed UUID), entity_id (hashed, ephemeral per project)
- **UI interactions**: zoom_level, drag_distance, selection_count, overlay_duration

**❌ NEVER TRACK (PII / Proprietary):**
- **Person information**: names, emails, display names
- **Team information**: team names (could contain person names)
- **Repo information**: repo names, full URLs (proprietary architecture details)
- **Context/Group names**: context names, group labels (architecture strategy)
- **User-entered text content**: purpose, notes, boundaryNotes, description, communicationMode (actual text)
- **Jira board URLs**: full URLs (internal project info)
- **Project names**: project.name field (could reveal company info)

**⚠️ HOW WE HANDLE TEXT FIELDS (Char Count Only):**
Instead of tracking text content, we track:
```typescript
'text_field_edited'
  - field_name: 'purpose' | 'notes' | 'description'
  - old_char_count: 50
  - new_char_count: 150
  - edit_type: 'added_text' | 'deleted_text' | 'replaced_text'
```
This tells us if users are documenting architecture WITHOUT capturing sensitive content.

**⚠️ HOW WE HANDLE URLS (Platform Only):**
Instead of tracking full URLs, we track:
```typescript
'repo_url_added'
  - platform: 'github' | 'gitlab' | 'bitbucket' | 'other'
  - has_remote_url: true
```
This tells us which platforms users integrate with WITHOUT capturing proprietary repo paths.

### **Simple Analytics Compliance:**

**What we track (COMPLIANT):**
- ✅ Project IDs (identifies projects, not people - like EventCatalog's `cId`)
- ✅ Deployment context (categorized: hosted_demo/self_hosted/localhost)
- ✅ Feature usage (booleans and counts)
- ✅ Aggregate metrics (context counts, relationship counts, char counts)
- ✅ UI interaction patterns (zoom, pan, selection, drag distances)
- ✅ Entity counts (people, teams, repos) WITHOUT names or identifying info

**What we DON'T track (PII):**
- ❌ User-entered text content (project names, context names, descriptions, notes)
- ❌ Person names or emails
- ❌ Team names or repo names
- ❌ Full URLs (repo URLs, Jira board URLs, hostnames)
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

### **After Slice 5 (View-Specific Features):**
- Which strategic views are most valuable?
- Are users applying DDD concepts correctly?
- Do Wardley maps resonate with users?
- Is temporal evolution helping users plan?
- Are actors and needs connecting to contexts meaningfully?
- Do users understand the value chain Y-axis?
- Is Distillation 2D positioning intuitive?

### **Cross-Cutting Insights (All Slices):**
- Are people & teams features being adopted?
- Do users document architecture thoughtfully (text fields, notes)?
- Are canvas navigation tools (zoom/pan/fit) sufficient?
- Is the multi-project workflow working well?
- Are creation flows (overlays) intuitive or causing friction?

---

## Key Design Decisions

### **Changed from Original Plan:**
1. **Expanded to 5 slices** - Added view-specific features as separate slice for clarity
2. **Reordered by urgency** - Validation → Prioritization → Onboarding → Retention → Feature Validation
3. **Added detailed + summary event pattern** - Optimized for Simple Analytics dashboard limitations
4. **Analytics enabled for localhost** - Captures all usage, project IDs distinguish users
5. **Project-level identifiers** - Mirrors EventCatalog's catalog ID pattern (privacy-compliant)
6. **Comprehensive property change tracking** - Track old/new values for all edits
7. **Project lifecycle events** - Track when projects open/close for session duration analysis

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
