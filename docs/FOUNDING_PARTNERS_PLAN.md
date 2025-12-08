# Founding Partners Launch Plan

**Created:** 2025-12-08
**Status:** Action Plan
**Goal:** Validate willingness-to-pay with minimum infrastructure

---

## Executive Summary

Skip the full Clerk + Polar + D1 + webhook infrastructure. Instead, launch a "Founding Partners Program" to validate demand with concierge approach, then build proper infrastructure after validation.

**Decision deadline:** Build real auth/payment infrastructure after 10 paying customers OR 30 days, whichever comes first.

---

## Phase 1: Founding Partners (Week 1-2)

### Day 1-2: Create Landing/Pricing Page

**Option A: Separate landing page (recommended)**
- Create simple page at `contextflow.virtualgenius.com/founding-partners`
- Sections: Problem → Solution → Demo video → Founding Partners CTA

**Option B: Add to existing app**
- Add "Founding Partners" modal accessible from TopBar
- Show when user has been active for 5+ minutes

**Page content:**
```
# Stop Losing Your DDD Workshops to Outdated Miro Boards

You run great workshops. The context maps become stale after 2 weeks.
ContextFlow keeps your domain models alive and collaborative.

[90-second demo video showing workshop scenario]

## Founding Partners Program (10 spots)

Join as a founding partner and help shape the future of DDD tooling.

What you get:
- Lifetime Pro access (unlimited projects, forever)
- Priority support via Discord/email
- Input on the roadmap
- Your name in the credits

Investment: $500 one-time (vs $299/year when we launch publicly)

[Book a 15-min Call] → Calendly link
[Pay Now] → Stripe Payment Link
```

**Tools needed:**
- Stripe Payment Link ($500 one-time) - 5 minutes to create
- Calendly free tier for discovery calls - already have?
- Demo video (screen recording) - 1-2 hours

### Day 3-5: Direct Outreach

**Target channels:**
1. **Twitter/X** - Post: "Built a DDD context mapping tool. Looking for 10 consultants to be founding partners. DM me."
2. **DDD Discord/Slack** - Domain-Driven Design community
3. **LinkedIn** - Post in DDD groups, reach out to DDD practitioners who share content
4. **Email** - Anyone who's engaged with EventStormer or VirtualGenius previously

**Outreach template:**
```
Hi [Name],

I noticed you [do DDD workshops / shared content about context mapping / etc].

I've been building ContextFlow - a visual context mapping tool for DDD workshops.
Think of it as "Miro but purpose-built for domain modeling" with real-time collaboration.

I'm looking for 10 founding partners to help shape the product.
Would you be interested in a 15-min demo?

[Link to demo or landing page]
```

**Goal:** 20 conversations scheduled

### Day 6-14: Discovery Calls + Manual Onboarding

**Call structure (30 min):**
1. (5 min) What DDD work do you do? Who are your clients?
2. (10 min) Screen share demo - show ACME sample project
3. (10 min) Watch them try it - note confusion points
4. (5 min) "Would you pay $500 for lifetime access?" → Send Stripe link if yes

**After payment:**
1. Get their email
2. Create them a project manually (or they use app normally)
3. Schedule follow-up after their first real workshop
4. Document: What confused them? What delighted them? Feature requests?

---

## Phase 2: Minimum Viable Security (Before ANY Launch)

Even for concierge, add these safeguards:

### Must Do (2-3 hours total)

1. **Cloudflare billing alert** - Set $50/day threshold
   - Dashboard → Notifications → Create alert
   - 5 minutes to configure

2. **Cloudflare spending cap** - Set $200/month hard limit
   - Prevents bankruptcy if rate limiting fails
   - 5 minutes to configure

3. **Basic rate limiting** - Use Cloudflare dashboard
   - Rule: If requests to `/parties/*` > 100/min from same IP → Block 10 min
   - No code required, 15 minutes to configure

### Can Wait Until 10 Customers

- Full Clerk auth integration
- JWT validation in Worker
- D1 database
- Webhook handlers

---

## Phase 3: When to Build Real Infrastructure

**Trigger:** First of these conditions:
- 10 paying customers (validation success)
- 30 days elapsed (time-boxed experiment)
- Manual provisioning taking >2 hours/week

### Minimal Clerk + Polar Stack (1 week)

Once validated, build:

1. **Day 1: Clerk integration**
   - `<ClerkProvider>` wrapper in main.tsx
   - `<SignIn>` / `<UserButton>` in TopBar
   - Zustand store updates for user state

2. **Day 2: Worker auth**
   - JWT validation in `workers/server.ts` fetch handler
   - Extract tier from JWT claims
   - Block project creation if free + owns 1 project

3. **Day 3-4: Polar webhook**
   - Create webhook handler in `workers/webhook.ts`
   - Use `@polar-sh/sdk` validateEvent() - it's simple
   - Update Clerk metadata on subscription_created

4. **Day 5: Testing + polish**
   - E2E test payment flow
   - Handle edge cases (payment delayed, retry, etc.)

---

## Pricing Validation

### Test During Founding Partners Phase

| Offer | Who Gets It | Goal |
|-------|-------------|------|
| $500 lifetime | First 5 eager adopters | Premium anchor |
| $299/year | People who balk at $500 | Test annual pricing |
| "What would you pay?" | Hesitant prospects | Discover price ceiling |

### Questions to Ask Every Prospect

1. "What would make you pay $500 for this?"
2. "At what price would you consider it too expensive?"
3. "Would you prefer monthly ($29) or annual ($299)?"
4. "When would you actually use this? (Before workshop? During? After?)"

---

## Success Criteria

### After 2 Weeks

| Metric | Success | Failure |
|--------|---------|---------|
| Paying customers | 3+ at any price | 0-1 despite 20 conversations |
| Conversion trigger | Clearly identified | Still unclear |
| Price validation | Know if $99 is too low | No pricing data |
| Feature requests | Top 3 list from customers | Building blind |

### What to Do If Failure

**0 customers after 20 conversations:**
- Price wrong? → Test $49/month
- Persona wrong? → Try enterprise teams instead of consultants
- Value prop wrong? → Interview the "no" people, find what's missing
- Timing wrong? → Wait for conference season?

**DO NOT build infrastructure if validation fails.** Pivot first.

---

## Files to Create

### For Landing Page

```
public/founding-partners.html (if separate page)
OR
src/components/FoundingPartnersModal.tsx (if in-app)
```

### Content Needed

- [ ] 90-second demo video (screen recording of workshop scenario)
- [ ] Stripe Payment Link ($500 one-time)
- [ ] Calendly booking link
- [ ] Discord server or support channel

---

## Tracking

### Manual Customer Tracking (until 10 customers)

Use a simple spreadsheet:

| Email | Paid Date | Amount | How Found | First Workshop | Feature Requests |
|-------|-----------|--------|-----------|----------------|------------------|
| alice@example.com | 2025-12-10 | $500 | Twitter DM | 2025-12-15 | "Export to PPT" |

### Metrics to Watch

- Conversations → Payments conversion rate (goal: 15-25%)
- Time from first contact → payment (days)
- Post-payment feature requests (what to build next)

---

## What NOT to Build Yet

- Clerk integration
- Polar webhooks
- D1 database
- Server-side Yjs validation
- Structured logging
- Feature gates in UI
- Upgrade prompts
- Free tier enforcement (trust early customers)

**Build these AFTER validation, not before.**

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Landing page + outreach | 20 conversations scheduled |
| 2 | Discovery calls + close | 3-5 paying customers |
| 3 | Learn from usage | Feature priority list |
| 4 | Build or pivot | Clerk+Polar if validated, pivot if not |

---

## Related Documents

- [SAAS_IMPLEMENTATION_PLAN.md](SAAS_IMPLEMENTATION_PLAN.md) - Full infrastructure plan (for Phase 3)
- [SAAS_MONETIZATION_STRATEGY.md](SAAS_MONETIZATION_STRATEGY.md) - Pricing research
