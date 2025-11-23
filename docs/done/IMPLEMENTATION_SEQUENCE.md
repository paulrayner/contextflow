# Implementation Sequence: Analytics vs Store Refactoring

**Decision**: Implement analytics features first, then refactor store
**Date**: 2025-11-22

## Recommendation

**Implement analytics (ANALYTICS_PLAN.md) before store refactoring (STORE_REFACTORING_PLAN.md)**

Recommended sequence:
1. Analytics Slice 2 (Feature Adoption)
2. Analytics Slice 3 (Onboarding/FTUE)
3. Store Refactoring Slice 1-2 (Classification + Types)
4. Reassess based on data

## Why Analytics First

### 1. Independent Value Delivery
- Analytics Slice 1 is already complete ✅
- Slice 2 (Feature Adoption) delivers immediate product insights
- Each analytics slice provides actionable data independently
- Refactoring provides zero user value until complete

### 2. Lower Risk
- Analytics adds new code paths (track events in store actions)
- Refactoring moves existing code around
- If analytics breaks something, you catch it immediately via missing events
- If refactoring breaks something, you might not notice until a user reports a bug

### 3. Simpler Integration
- Adding `trackEvent()` calls to existing store actions is straightforward
- The store is large but well-structured (easy to locate each action)
- Analytics doesn't require understanding the full complexity of undo/redo or command logic

### 4. Better Testing Story
- Analytics: Write tests for new analytics utilities, verify events fire
- Refactoring: Must ensure ZERO behavioral changes across 2000+ lines
- Analytics testing is additive; refactoring testing is defensive

### 5. Data-Informed Refactoring
- After analytics: You'll have data showing which features are used most
- This informs refactoring priorities (focus on frequently-used code paths)
- After refactoring: You just have cleaner code structure (no new insights)

## The "Tidy First?" Question

Kent Beck's principle applies: **Tidy after, not before** when:
- The new feature is well-understood (analytics events are clearly defined ✅)
- The existing code is functional (store works fine ✅)
- Refactoring won't make the feature significantly easier (adding `trackEvent()` calls is simple either way ✅)

Tidy first when:
- You're about to make complex changes requiring deep understanding
- The existing structure actively blocks the new feature
- You need to understand the code by reorganizing it

**In this case**: Analytics doesn't require deep understanding of store internals—you just need to know where actions are triggered.

## Detailed Sequence

### Phase 1: Core Analytics (Immediate Value)
1. **Analytics Slice 2** - Feature Adoption Tracking
   - Add `trackEvent()` calls to context/relationship/group/repo actions
   - Test event firing in analytics dashboard
   - Get immediate product insights on feature usage

2. **Analytics Slice 3** - Onboarding/FTUE Tracking
   - Add milestone tracking for first-time user experience
   - Understand where users get stuck
   - Identify onboarding friction points

### Phase 2: Quick Refactoring Wins (Build Confidence)
3. **Store Refactoring Slice 1** - Classification System
   - Add JSDoc tags (@category) to organize code mentally
   - Zero risk, improves IDE navigation
   - ~30 minutes of work

4. **Store Refactoring Slice 2** - Types Extraction
   - Move types to dedicated file
   - Reduces store.ts by ~200 lines
   - Low risk, clear benefit

### Phase 3: Reassess and Continue
By this point, you'll have:
- Analytics data showing which features are used most
- Confidence in refactoring process from Slice 1-2
- Better understanding of which code paths need attention

Continue with either:
- **Analytics Slice 4-5** (Collaboration + Performance)
- **Store Refactoring Slice 3-5** (Utilities + Commands + Action modules)

Decision should be based on:
- What analytics data reveals about feature usage
- Whether store complexity is blocking new features
- Team priorities and bandwidth

## One Caveat

If you find yourself thinking "I can't figure out where to add this tracking call because the store is too complex," then pause and do:

**Store Refactoring Slice 5** (Extract action modules) for just the domains you need.

However, this is unlikely—the current store is large but reasonably well-organized with clear action definitions.

## Success Metrics

**Analytics-first approach succeeds if**:
- All tracking events implemented in < 1 day
- Zero behavioral regressions
- Dashboard shows meaningful data within first week
- Data informs subsequent refactoring priorities

**Would indicate refactoring-first was better if**:
- Analytics implementation takes > 2 days due to store complexity
- Significant difficulty locating where to add tracking calls
- Multiple false starts due to misunderstanding store structure

## Related Documents
- [Analytics Implementation Plan](ANALYTICS_PLAN.md)
- [Store Refactoring Plan](STORE_REFACTORING_PLAN.md)
- [Project Roadmap](PLAN.md)
