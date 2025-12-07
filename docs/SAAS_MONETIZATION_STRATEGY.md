# SaaS Monetization Strategy for ContextFlow

**Date:** 2025-01-21 (Updated: 2025-12-07)
**Status:** Implementation Phase - Cloud Sync Complete, Auth/Payments Next
**Goal:** Turn-key approach for solo SaaS provider with minimal complexity

---

## Executive Summary

This document outlines research and recommendations for monetizing ContextFlow as an open-core SaaS application with both hosted and self-hosted options. The primary focus is on **validation-first approach** using turnkey solutions to minimize time to market while maintaining control over branding and user experience.

**Key Recommendation:** Start with **Polar.sh + Clerk + Simple Analytics** stack. ✅ **Cloud sync via Yjs + Cloudflare Durable Objects is already implemented** (see `docs/CLOUD_SYNC_PLAN.md`). Next step: add auth/payments layer.

**Why this stack:** Matches what 90% of successful solo founders use (based on 2025 indie hacker research). Simple Analytics used by EventCatalog and other popular open-source projects.

---

## Table of Contents

1. [Competitor Pricing Analysis](#competitor-pricing-analysis)
2. [Payment & Subscription Platforms](#payment--subscription-platforms)
3. [Authentication Solutions](#authentication-solutions)
4. [Analytics Options](#analytics-options)
5. [Recommended Stack](#recommended-stack)
6. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
7. [Storage Architecture](#storage-architecture-resolved)
8. [Phased Rollout Plan](#phased-rollout-plan)
9. [Pricing Strategy](#pricing-strategy)
10. [Cost Analysis](#cost-analysis)
11. [Decision Framework](#decision-framework)
12. [Enterprise Features & Compliance](#enterprise-features--compliance)

---

## Competitor Pricing Analysis

Research conducted December 2025 on comparable tools:

| Product | Free Tier | Paid Tier | Target |
|---------|-----------|-----------|--------|
| **Excalidraw+** | Free forever (basic) | $6-7/user/mo (~$72-84/yr) | General whiteboard |
| **Miro** | 3 boards, unlimited members | $8-16/user/mo ($96-192/yr) | Collaboration |
| **Lucidchart** | 3 docs, 60 shapes | $7.95/mo individual (~$95/yr) | Diagramming |
| **Structurizr** | 1 workspace | $5/workspace/mo ($60/yr min) | Architecture (C4) |
| **Penpot** | Unlimited (generous) | $7/editor/mo (cap $175/mo) | Design tool |
| **IcePanel** | Free tier available | Paid tiers (team-focused) | C4 model |
| **Context Mapper** | **FREE (open source)** | N/A | DDD DSL |

### Key Insights

1. **Price range**: Most tools charge $60-100/year for individual plans
2. **Free tier generosity**: All competitors allow some creation (1-3 projects/boards)
3. **Context Mapper is free**: The closest DDD-specific tool is open source

### ContextFlow Differentiation vs Context Mapper

| Aspect | Context Mapper | ContextFlow |
|--------|---------------|-------------|
| Interface | Text-based DSL | Visual, interactive canvas |
| Audience | Developers | Architects + stakeholders |
| Use case | Code-driven modeling | Workshop facilitation |
| Output | Generated diagrams | Client-ready presentations |
| Learning curve | Steep (DSL syntax) | Intuitive (drag-and-drop) |

**Value prop**: ContextFlow is the "workshop-ready" tool for DDD practitioners who need to facilitate sessions with non-technical stakeholders, not write DSL code.

---

## Payment & Subscription Platforms

All options below are **Merchant of Record** (MoR) solutions - they handle tax compliance, VAT, invoicing, and payment processing.

### Option 1: Polar.sh ⭐ RECOMMENDED

**Best for:** Developer tools, indie hackers, validation phase

**Pros:**

- Cheapest MoR on market (5% flat fee)
- Open source, developer-friendly
- Modern API and beautiful checkout UX
- Growing fast in indie dev community (2024-2025)
- Transparent pricing (no hidden fees)
- Seat-based pricing available (private beta)
- User feedback: "smoothest, most developer-friendly payment integration"

**Cons:**

- Newer platform (less proven than Paddle/FastSpring)
- Smaller ecosystem
- Seat-based pricing in private beta

**Pricing:** 5% + payment processing (~3%) = ~8% total

**Examples:** Growing adoption among developers who "ditched Stripe for Polar" in 2024-2025

---

### Option 2: Lemon Squeezy

**Best for:** Small businesses, creators, solopreneurs

**Pros:**

- Acquired by Stripe (July 2024) - stable/trusted
- 5% + 50¢ per transaction (competitive)
- Large ecosystem of boilerplates (SaasterKit, etc.)
- Many tutorials available
- 950+ websites currently using it

**Cons:**

- Stripe acquisition causing integration uncertainty
- Some users report slower feature development post-acquisition
- Cannot migrate subscriptions out (lock-in concern)

**Pricing:** 5% + 50¢ per transaction

**Examples:**

- Canvas Supply (Framer templates)
- Notion template creator ($110k+/month)
- 950+ SaaS products

---

### Option 3: Paddle

**Best for:** B2B/enterprise SaaS from day one

**Pros:**

- Better enterprise invoicing and multi-currency
- Proven at scale with larger SaaS companies
- Strong B2B credibility
- Extensive features for sales-led growth
- Independent vendor (no acquisition uncertainty)

**Cons:**

- Higher fees: 5% + 50¢ + 3% non-domestic currency = ~8%+
- More enterprise-oriented (might be overkill for validation)

**Pricing:** 5-8% depending on currency

**Best use case:** If enterprise architects at large companies are primary market

---

### Option 4: Gumroad

**Best for:** Ultra-simple validation (then migrate away)

**Pros:**

- Dead simple setup (hours, not days)
- Built-in marketplace (Discover feature)
- No coding required
- Now acts as MoR (as of Jan 2025)

**Cons:**

- **10% + 50¢ fee** (double competitors!)
- Limited SaaS features
- **Cannot migrate subscriptions** if you outgrow it
- Less sophisticated than alternatives

**Pricing:** 10% + 50¢ per transaction

**Recommendation:** Avoid - too expensive long-term

---

### Option 5: FastSpring

**Best for:** B2B software with enterprise sales motion

**Pros:**

- Built specifically for B2B SaaS/software companies
- Sales team features (quotes, custom invoices, POs, net-30 terms)
- "Most extensive B2B features of any MoR"
- Handles complex enterprise scenarios

**Cons:**

- Overkill for solo founder starting out
- Higher fees than Lemon Squeezy/Polar
- Contact sales for pricing (no transparent pricing)

**Pricing:** Custom (typically higher than 5%)

**When to use:** Selling $5k-50k/year enterprise contracts

---

### Option 6: DIY Stripe + Supabase

**Best for:** Maximum control, long-term cost optimization

**Pros:**

- Cheapest at scale: Stripe 2.9% + 30¢
- Complete control over UX
- Supabase Auth simpler than before
- Auth + database + storage bundled

**Cons:**

- **You handle tax compliance** (VAT, sales tax - complex!)
- Edge functions for webhooks (previous pain point)
- More ongoing maintenance
- Longer time to market than turnkey solutions

**Pricing:** $25/mo (Supabase Pro) + 2.9% Stripe fees

**Option:** Use Stripe Tax ($0.50/transaction for compliance)

**Recommendation:** Avoid for validation phase - too complex

---

## Authentication Solutions

### Clerk ⭐ RECOMMENDED

**Best for:** Drop-in auth, B2B SaaS, fast validation

**Features:**

- Pre-built beautiful UI components (`<SignIn>`, `<UserButton>`, `<OrganizationSwitcher>`)
- Multi-tenancy built-in via Organizations
- SSO/SAML support (enterprise-ready)
- Role-based access control
- 10k MAU free tier

**Pricing:**

- Free: 10k MAU
- Pro: Starts ~$25/mo

**Multi-tenancy:** Built-in Organizations feature significantly reduces custom development work

**Examples:**

- Bucket.co (feature management tool)
- Multiple Next.js SaaS startups

---

### Supabase Auth

**Best for:** Database-integrated apps, cost optimization at scale

**Features:**

- Free tier: 50k MAU (100k on Pro plan)
- Bundled with database, storage, edge functions
- Row Level Security (RLS) for fine-grained authorization
- Need to build your own UI components

**Pricing:**

- Free: 50k MAU
- Pro: $25/mo (includes database, storage, etc.)

**Multi-tenancy:** Requires custom implementation

**Pros:**

- Cheaper at scale if you need database anyway
- Complete control over UX

**Cons:**

- No pre-built UI components
- SSO/SAML requires custom setup
- Steeper learning curve for RLS

---

### Comparison Table

| Feature | Clerk | Supabase Auth |
|---------|-------|---------------|
| UI Components | ✅ Pre-built | ❌ Build your own |
| Free tier | 10k MAU | 50k MAU (100k Pro) |
| Pricing | ~$25/mo | $25/mo (bundled) |
| Multi-tenancy | ✅ Built-in Organizations | ❌ Custom implementation |
| SSO/SAML | ✅ Built-in | ❌ Custom setup |
| Best for | Fast validation, B2B | Cost optimization, DB apps |

**Recommendation:** Clerk for validation phase (faster), consider Supabase later for cost optimization

---

## Analytics Options

### What Solo Founders Actually Use (2025 Research)

Based on indie hacker community research and analysis of successful solo projects:

**90% of solo founders use privacy-first analytics:**

- Simple Analytics, Plausible, or Fathom
- Cheap ($9-19/mo), simple, privacy-compliant
- No cookies, GDPR-compliant out-of-the-box
- Just track: traffic, conversions, basic goals

**10% add product analytics later:**

- PostHog or Mixpanel
- Only after they have paying customers
- When they need to optimize features, not just track visits

**Real-world example:** EventCatalog (3.5k+ stars) uses Simple Analytics. See implementation details in Appendix.

---

### Polar Dashboard (Built-in)

**Included with Polar.sh:**

- Transaction analytics
- Revenue metrics (MRR, ARR, growth)
- Conversion tracking
- Customer insights
- Geographic distribution
- Payment method breakdown

**Pro:** Free, no additional setup
**Con:** Limited to payment/subscription data (no product usage insights)

---

### Simple Analytics ⭐ RECOMMENDED (Phase 1)

**Best for:** Solo founders in validation phase (most common choice)

**Features:**

- Privacy-first (no cookies, GDPR-compliant)
- Lightweight script (77x smaller than Google Analytics)
- Custom event tracking (like EventCatalog uses)
- Traffic sources, conversions
- Simple, clean dashboard
- Can track custom events via API

**Pricing:** $9/mo (10k visitors) → $49/mo (1M visitors)

**Why solo founders choose this:**

- ✅ Simple setup (drop-in script)
- ✅ Privacy-compliant (no consent banners)
- ✅ Cheap and predictable pricing
- ✅ Zero maintenance
- ✅ Enough for validation phase

---

### Plausible

**Best for:** Similar to Simple Analytics, slightly more popular

**Features:**

- Lightweight, no cookies
- Beautiful single dashboard
- GDPR compliant
- Traffic sources, conversions
- Open-source option available

**Pricing:** $9/mo (10k pageviews)

**Why choose this:**

- Most mentioned in indie hacker community
- Quote: *"It's pretty simple, but honestly it's got everything I need"*
- Self-hosted option available (Plausible CE)

---

### Fathom Analytics

**Best for:** Simplicity + real-time analytics

**Features:**

- Privacy-first (no cookies)
- 2kB script size
- Real-time analytics
- Goal tracking

**Pricing:** $14/mo (100k pageviews)

**Why choose this:**

- Used by levelsio (Nomadlist founder - $74k MRR solo)
- Slightly more expensive but highly polished
- EU-compliant out of the box

---

### PostHog (Optional - Phase 3)

**Best for:** Product analytics when optimizing features (not for validation phase)

**Features:**

- Web analytics + product analytics
- Session replay (watch user sessions)
- A/B testing
- Feature flags
- Surveys
- Funnels, cohorts, retention
- Data warehouse

**Pricing:**

- Free: 1M events/month
- Pay-as-you-go after free tier

**When to add this:**

- ✅ After you have 100+ paying customers
- ✅ When you need to decide which features to build next
- ✅ When you want to A/B test pricing or features
- ✅ When you need session replay to debug UX issues

**Why NOT for Phase 1:**

- ❌ More complex than you need initially
- ❌ Steeper learning curve
- ❌ Overkill when you just need traffic + conversions

---

## Recommended Stack

### Primary Recommendation: Polar.sh + Clerk + Simple Analytics ⭐

**Stack:**

- **Payments:** Polar.sh (5% fee, merchant of record)
- **Auth:** Clerk (drop-in components, multi-tenancy ready)
- **Analytics:** Simple Analytics ($9/mo)

**Why this combo:**
✅ Fastest time to market
✅ Lowest transaction fees (5% + processing)
✅ No tax/compliance headaches (Polar is MoR)
✅ No Stripe webhook debugging nightmares
✅ Enterprise-ready (Clerk SSO/SAML when needed)
✅ Privacy-first analytics (no cookies, GDPR-compliant)
✅ **Matches what successful solo founders actually use** (EventCatalog pattern)

**Total cost:** ~$9-50/mo + 8% transaction fee

**This is the most common stack for solo founders in 2025.**

---

### Alternative Analytics Options

**If you prefer something else:**

**Option A: Plausible instead of Simple Analytics**

- Same price ($9/mo)
- More popular in indie hacker community
- Open-source self-hosted option available

**Option B: Polar + Clerk only (no external analytics initially)**

- Wait until you have 10+ paying customers
- Polar shows conversions, Clerk shows signups
- Add Simple Analytics later when you need more insights
- **Cheapest option:** $0 extra cost

**Option C: Add PostHog for power users**

- If you need A/B testing from day 1
- If you want session replay to debug issues
- Free tier (1M events/month)
- More complex but more powerful

---

### Payment Platform Alternatives

**Lemon Squeezy instead of Polar:**

- More proven platform (Stripe-backed)
- Larger ecosystem (more boilerplates, tutorials)
- Same pricing as Polar (5% + 50¢)
- **Trade-off:** Stripe acquisition uncertainty vs Polar's independence

**Paddle for enterprise focus:**

- Better invoicing, PO support, net-30 terms
- More enterprise credibility
- Slightly higher fees (~8%) worth it for B2B

---

## Multi-Tenancy Strategy

### Clerk Organizations (Turnkey Approach)

Clerk provides **built-in multi-tenancy** via Organizations feature:

**What you get out-of-the-box:**

- `<OrganizationSwitcher />` - users create/switch teams
- `<OrganizationProfile />` - manage team members, send invites
- Role-based access control (admin, member, guest)
- User invitations via email
- Organization-level metadata storage

**Setup:** Toggle "Organizations" on in Clerk Dashboard → add 2 React components → done

**Time savings:** Eliminates need for custom multi-tenancy implementation

---

### Licensing Models with Polar

#### Option A: Seat-Based Pricing (Ideal for Team tier)

**How it works:**

1. Customer buys "Team plan - 5 seats" for $999/year
2. Polar provides billing manager interface
3. Billing manager assigns seats to team members by email
4. Each seat holder gets license key/entitlement
5. Sync to Clerk Organizations via webhooks

**Status:** Private beta (need to request access)

**Pros:**

- Polar handles seat management UI
- Dynamic add/remove seats with proration
- Scales revenue with team size

---

#### Option B: Organization-Level Subscription (Available Now)

**How it works:**

1. Customer buys "Team plan" subscription via Polar
2. Create Clerk Organization for them
3. Org admin invites unlimited team members via Clerk UI
4. All members inherit organization's subscription status
5. Validate: `user.orgId` → check subscription in metadata

**Pros:**

- Available immediately (no beta access needed)
- Simpler pricing (unlimited seats)
- Easier to sell ("bring your whole team")
- Less customer support burden

**Cons:**

- No per-seat revenue scaling

**Recommendation:** Start with unlimited seats, switch to per-seat if teams average 20+ people

---

### Webhook Sync Pattern (Polar → Clerk)

**Simple serverless function flow:**

```text
1. Customer buys Pro plan ($99/year) on Polar
   ↓
2. Polar webhook → your Cloudflare Worker
   ↓
3. Webhook handler:
   - Receive subscription_created event
   - Extract customer email + subscription_id
   - Update Clerk user metadata:
     clerk.users.updateUserMetadata(userId, {
       privateMetadata: {
         subscription: {
           polarId: subscription_id,
           tier: "pro",
           status: "active"
         }
       }
     })
   ↓
4. React app checks Clerk metadata
   - tier === "pro" → unlimited projects/contexts
   - no tier → free tier limits (1 project, 5 contexts)
```

**No backend needed!** Just a simple serverless function (~100 lines of code).

---

## Storage Architecture (Resolved)

### Current State: Yjs + Cloudflare Durable Objects ✅

**Implemented architecture:**

- Yjs CRDT for conflict-free real-time collaboration
- IndexedDB (y-indexeddb) for offline persistence
- Cloudflare Durable Objects for WebSocket sync
- All projects automatically sync to cloud

**Benefits achieved:**

- ✅ True multi-user collaboration (real-time sync)
- ✅ Works across devices (cloud-synced)
- ✅ Offline editing works (Yjs buffers changes)
- ✅ No data loss risk (cloud persistence)
- ✅ Global low latency (Cloudflare edge)

**See:** `docs/CLOUD_SYNC_PLAN.md` for implementation details

---

### Cloud Sync Options

#### Option 1: Supabase Storage + IndexedDB Cache ⭐ RECOMMENDED (when needed)

**Pattern:** Cloud-first with offline fallback

**Architecture:**

```text
All Tiers (Current Implementation):
├─ Yjs CRDT for conflict-free collaboration
├─ Cloudflare Durable Objects for sync
└─ IndexedDB for offline persistence

Free Tier: Limited to 1 project, 5 contexts
Pro Tier: Unlimited projects and contexts
```

**Pros:**
✅ True multi-user collaboration
✅ Works across devices
✅ Offline editing still works
✅ Supabase free tier: 500MB database + 1GB storage
✅ RxDB + Supabase plugin handles sync automatically

**Cons:**
⚠️ Requires backend (breaks "no backend" goal)
⚠️ More complex implementation

**Cost:** Free tier → $25/mo Pro when needed

**Implementation tool:** RxDB-Supabase plugin (handles bidirectional sync)

---

#### Option 2: Dexie Cloud (Most Turnkey)

**Pattern:** IndexedDB + managed cloud sync service

**How it works:**

- Keep using IndexedDB via Dexie.js wrapper
- Dexie Cloud handles sync/auth/multi-user automatically
- Minimal code changes from current setup

**Pros:**
✅ **Most turnkey** - drop-in replacement
✅ Designed for offline-first apps
✅ Built-in auth, permissions, sharing
✅ Real-time sync automatic
✅ Keeps "browser-first" philosophy

**Cons:**
⚠️ Vendor lock-in (newer service)
⚠️ Pricing unclear (contact sales)
⚠️ Smaller ecosystem

**Cost:** Free tier available, paid tiers likely $25-100/mo

---

#### Option 3: Yjs CRDT + Cloudflare Durable Objects ✅ IMPLEMENTED

**Pattern:** Real-time collaboration with conflict-free data types

**How it works:**

- Data model uses Yjs CRDT format
- IndexedDB for offline persistence (y-indexeddb)
- Cloudflare Durable Objects for WebSocket sync
- Automatic conflict resolution

**Implementation details:** See `docs/CLOUD_SYNC_PLAN.md`

**Pros:**
✅ True collaborative editing (Google Docs-style)
✅ Automatic conflict resolution
✅ Cloudflare edge hosting (global low latency)
✅ Built-in offline support via Yjs

**Architecture:**

- Frontend: Yjs + y-indexeddb for local persistence
- Backend: Cloudflare Durable Objects for real-time sync
- All projects automatically sync to cloud

**Cost:** Cloudflare Workers/DO pricing (minimal at current scale)

---

#### Option 4: Keep IndexedDB, No Multi-Tenancy (Superseded)

**Pattern:** Different pricing model to avoid multi-user problem

**How it works:**

- Keep current IndexedDB architecture
- Only offer **single-user licenses** (no team tier)
- Add cloud export/backup features

**Note:** This option is superseded by the current Yjs + Cloudflare DO implementation which provides real-time collaboration for all tiers.

**Pros:**
✅ **Zero backend work**
✅ Maintains "browser-first" philosophy
✅ Simplest implementation (already done!)
✅ Export/import for manual collaboration

**Cons:**
❌ No real multi-user collaboration
❌ Limits market size

**Cost:** $0 (maybe $5/mo for backup storage)

**Recommendation:** Start here, add multi-tenancy only if customers demand it

---

## Phased Rollout Plan

### Phase 1: Cloud Sync ✅ COMPLETE

**Implemented:** Yjs + Cloudflare Durable Objects cloud sync

- All projects automatically sync to cloud
- Offline support via y-indexeddb
- Real-time collaboration ready
- See `docs/CLOUD_SYNC_PLAN.md` for details

---

### Phase 1.5: Auth & Payments (CURRENT)

**What to build:**

1. Integrate Clerk authentication
2. Integrate Polar.sh for payments
3. Implement quantity-based feature gates (project/context limits)
4. Deploy webhook handler (Cloudflare Worker) for Polar → Clerk sync

**Tiers:**

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 project, 5 bounded contexts, full collaboration |
| **Pro** | $99/year | Unlimited projects, unlimited contexts |
| **Enterprise** | Custom | SSO/SAML, audit logs, SLA, priority support |

**Key principle:** Collaboration/sync works for ALL tiers. Tiers differ only in quantity limits, not feature lockouts.

**Licensing model:** You pay for what you own, not what you collaborate on. License is tied to project owner - anyone can collaborate on shared projects regardless of their tier.

**No Team tier** - deferred until customers request org/billing features

**Backend required:** Webhook endpoint (Cloudflare Worker)
**Messaging:** "Professional DDD context mapping for software architects"

---

### Phase 2: Validate Demand (Early Adoption Period)

**Goals:**

- Get first 10 paying customers
- Survey customers: "Would you pay more for team collaboration?"
- Track feature requests

**Decision criteria:**

- If >50% ask for team features → proceed to Phase 3
- If <20% ask for teams → stay single-user
- If customers want "share projects" but not real-time → add export/import only

---

### Phase 3: Add Multi-Tenancy & Team Tier (If Validated)

**When:** After customers ask for team collaboration (see Multi-Tenancy Strategy section)

**New tier:** Team ($999/year) - Shared workspace, unlimited seats

---

### Phase 4: Enterprise Features (After $50k ARR)

**If enterprise customers appear:**

- Self-hosted deployment option
- SSO/SAML (already have via Clerk)
- Custom contracts, invoicing
- Consider switching to Paddle or FastSpring for better B2B features

---

## Pricing Strategy

### 3-Tier vs 4-Tier Model Decision

Before defining tiers, consider whether a Team tier is necessary. Penpot (a comparable open-source design tool) uses only 3 tiers: Free → Professional → Enterprise, with no separate Team tier.

#### 3-Tier Model (Penpot-style: Free/Pro/Enterprise)

**Pros:**

- Simpler pricing story - easier for customers to understand and choose
- Lower decision friction - no "should I get Team or Enterprise?" confusion
- Collaboration as default - makes the product feel more generous/modern
- Less infrastructure complexity - one collaboration tier to build, not two
- Easier marketing - "Pro includes your whole team" is compelling

**Cons:**

- Leaves money on table - teams of 20+ pay same as teams of 3
- No revenue scaling - flat price regardless of organization size
- Enterprise jump is steep - $299/year → $950/mo is a big gap
- May attract tire-kickers - unlimited seats could attract teams who won't pay for Enterprise later

#### 4-Tier Model (Free/Pro/Team/Enterprise)

**Pros:**

- Revenue scales with usage - larger teams pay more
- Gradual upgrade path - $299 → $999 → $5k+ feels natural
- Pricing flexibility - can experiment with per-seat vs flat team pricing
- Captures mid-market - teams too small for Enterprise but willing to pay more than Pro
- Validates demand - Team tier acts as signal for collaboration feature demand

**Cons:**

- More complex pricing page - customers must compare 4 options
- Feature allocation headaches - what goes in Team vs Enterprise?
- More infrastructure - potentially different collaboration/sync implementations per tier
- Cannibalizes Enterprise - some customers buy Team when they'd have paid Enterprise

#### Decision Guide

| If you value... | Choose |
|-----------------|--------|
| Simplicity & speed to market | 3-tier |
| Revenue maximization | 4-tier |
| Validation-first (stated goal) | 3-tier |
| Enterprise sales motion | 4-tier |

**Recommendation:** Given the validation-first philosophy, start with 3 tiers (Free/Pro/Enterprise). Add a Team tier later only if customers explicitly demand pricing between Pro and Enterprise.

---

### Recommended Tiers

#### Free Tier

- **Price:** $0
- **Limits:** 1 project, 5 bounded contexts (hard limit - warning at 4, block at 6)
- **Features:**
  - Full editing and collaboration on allowed projects
  - Real-time sync with collaborators
  - Export to JSON
  - Collaborate on unlimited Pro-owned projects (no license needed to join)
- **Goal:** Demonstrate value, natural upgrade when users need more contexts for real work

---

#### Pro Tier

- **Price:** $99/year
- **Target:** Individual software architects, consultants
- **Limits:** Unlimited projects, unlimited contexts
- **Features:**
  - Everything in Free, without limits
  - Priority support
- **Positioning:** "Unlimited DDD context mapping"

---

#### Enterprise Tier (Later - After validation)

- **Price:** Custom ($5k-50k/year)
- **Target:** Large enterprises, regulated industries
- **Features:**
  - Everything in Pro
  - SSO/SAML integration (via Clerk)
  - Audit logging
  - Custom SLA
  - Dedicated support
  - Custom contracts/invoicing
- **Positioning:** "Secure, compliant, enterprise-ready"

**Deferred:** Team tier - revisit only if customers request org/billing features

---

## Cost Analysis

### Monthly Recurring Costs

**Phase 1 (Validation - first 100 users):**

- Clerk: $0 (free tier up to 10k MAU)
- Polar.sh: $0 monthly fee
- Simple Analytics: $9/mo (10k visitors)
- Webhook hosting: $0 (Vercel/Cloudflare free tier)
- **Total: $9/month**

**Phase 2 (Growing - 500 users):**

- Clerk: $25-50/mo (exceeds free tier)
- Polar.sh: $0 monthly fee
- Simple Analytics: $9-19/mo (still within tier)
- Webhook hosting: $0 (still free)
- **Total: ~$34-69/month**

**Phase 3 (With multi-tenancy - 2k users):**

- Clerk: $50-100/mo
- Polar.sh: $0 monthly fee
- Simple Analytics: $19-29/mo
- Supabase OR Dexie Cloud: $25-100/mo
- PostHog (optional): $0-50/mo if added
- Webhook hosting: $0
- **Total: ~$94-279/month**

---

### Transaction Costs

**Polar.sh pricing:**

- 5% Polar fee
- ~3% payment processing (Stripe/PayPal)
- **Total: ~8% per transaction**

**Example at different ARR levels:**

| Annual Recurring Revenue | Transaction Fees (8%) | Monthly Platform Costs | Total Annual Cost | % of Revenue |
|-------------------------|----------------------|----------------------|-------------------|-------------|
| $10k | $800 | $108 ($9/mo) | $908 | 9.1% |
| $50k | $4,000 | $408 ($34/mo avg) | $4,408 | 8.8% |
| $100k | $8,000 | $828 ($69/mo avg) | $8,828 | 8.8% |
| $250k | $20,000 | $2,000 ($167/mo avg) | $22,000 | 8.8% |

---

### Cost Comparison: Turnkey vs DIY

**Turnkey (Polar + Clerk + Simple Analytics) at $50k ARR:**

- Transaction fees: $4,000/year (8%)
- Platform costs: $408/year (Clerk + Simple Analytics)
- Development effort: Minimal
- **Total cost: $4,408/year (8.8% of revenue)**
- **Your time saved: Significant (avoids custom implementation)**

**DIY (Stripe + custom auth) at $50k ARR:**

- Stripe fees: $1,450/year (2.9%)
- Stripe Tax: $500/year (for compliance)
- Supabase: $300/year
- Development effort: Substantial initial + ongoing maintenance
- **Total cost: $2,250/year (4.5% of revenue)**
- **Your time cost: Significant opportunity cost**

**Verdict:** Pay extra 5% to avoid substantial development work during validation phase. Consider DIY migration after $250k ARR.

---

## Decision Framework

### Decision Matrix

| Scenario | Payment | Auth | Analytics | Storage | Team Support | Implementation Effort |
|----------|---------|------|-----------|---------|--------------|----------------------|
| **ContextFlow current** ⭐ | Polar.sh | Clerk | Simple Analytics | Yjs + Cloudflare DO ✅ | Yes (real-time) | Auth/payments remaining |
| **Cost optimized** | Polar.sh | Supabase | Plausible | Yjs + Cloudflare DO | Yes (real-time) | Medium |
| **Enterprise-ready** | Paddle | Clerk | PostHog | Yjs + Cloudflare DO + on-prem | Yes (real-time) | Substantial |
| **Full control** | Stripe | Supabase | Self-hosted | Yjs + self-hosted | Yes (real-time) | Very substantial |

**Note:** ContextFlow has already implemented Yjs + Cloudflare Durable Objects for cloud sync. The remaining work is adding Clerk auth and Polar.sh payments.

---

## Recommended Next Steps

### Step 1: Decide on Approach

1. **Choose validation path:**
   - ✅ Recommended: "Fastest validation" path
   - Keep IndexedDB, add Polar + Clerk
   - Launch with Free + Pro tiers only

2. **Set up accounts:**
   - Create Polar.sh account
   - Create Clerk account
   - Create Simple Analytics account ✅ **Done!**

3. **Plan implementation:**
   - Review current codebase
   - Identify where to add feature gates
   - Plan webhook endpoint deployment

---

### Step 2: Basic Integration

**Core payment and auth integration:**

1. Add Clerk authentication components
2. Create Polar products (Free, Pro tiers)
3. Implement feature gates in React
4. Add "Download JSON" export for Pro users

---

### Step 3: Polish & Launch

**Finalize and deploy:**

1. Deploy webhook handler (Vercel function)
2. Test purchase flow end-to-end
3. Add basic landing page / pricing page
4. Soft launch to small audience

---

### Step 4: Validate & Learn

**Gather customer feedback:**

1. Get first paying customers
2. Survey: "What features would make you upgrade?"
3. Track: "How many ask for team collaboration?"
4. Decide: Add multi-tenancy or stay single-user?

---

### Step 5 (If Needed): Add Multi-Tenancy

**If demand validated:**

1. Enable Clerk Organizations
2. Integrate Dexie Cloud OR Supabase
3. Launch Team tier
4. Migrate existing customers if needed

---

## Appendix: Integration Examples

### EventCatalog's Simple Analytics Implementation

**Real-world example of what you're building:**

EventCatalog (3.5k+ stars, solo founder project) uses Simple Analytics with this approach:

**Code structure:**

```javascript
// src/analytics/analytics.js
import axios from 'axios';

export const trackEvent = async (eventName, metadata = {}) => {
  try {
    await axios.post('https://queue.simpleanalyticscdn.com/events', {
      type: 'event',
      hostname: 'eventcatalog.dev',
      event: eventName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    // Silently fail - don't break UX if analytics is down
  }
};
```

**Events they track:**

- Page views (automatic)
- Custom events: user actions, feature usage
- Metadata: timestamp, user agent, platform

**Key lessons:**

- ✅ Simple POST requests (no complex SDK)
- ✅ Error handling that doesn't break UX
- ✅ Custom event tracking for conversions
- ✅ Privacy-first (no cookies)

**You can copy this exact pattern for ContextFlow.**

---

### Example Boilerplates Using Similar Stack

**SaasterKit** - Next.js + Clerk + Lemon Squeezy: <https://github.com/leandroercoli/SaasterKit>

**Supastarter** - Next.js + Clerk + Lemon Squeezy/Polar/Stripe: <https://supastarter.dev>

**Pipedream Integration** - Auto-sync Lemon Squeezy/Polar → Clerk: <https://pipedream.com/apps/lemon-squeezy/integrations/clerk>

---

## Resources

**Polar.sh:**

- Homepage: <https://polar.sh>
- Docs: <https://docs.polar.sh>
- Seat-based pricing: <https://polar.sh/docs/features/seat-based-pricing>

**Clerk:**

- Homepage: <https://clerk.com>
- Multi-tenancy guide: <https://clerk.com/articles/multi-tenancy-in-react-applications-guide>
- Organizations docs: <https://clerk.com/docs/guides/multi-tenant-architecture>

**Simple Analytics:**

- Homepage: <https://simpleanalytics.com>
- Docs: <https://docs.simpleanalytics.com>
- Event tracking API: <https://docs.simpleanalytics.com/events>
- EventCatalog implementation: <https://github.com/event-catalog/eventcatalog/blob/main/src/analytics/analytics.js>

**Alternative Analytics:**

- Plausible: <https://plausible.io>
- Fathom: <https://usefathom.com>
- PostHog: <https://posthog.com>

**Dexie Cloud:**

- Homepage: <https://dexie.org>
- Cloud sync: <https://dexie.org> (see "Dexie Cloud" section)

**Supabase + RxDB:**

- RxDB-Supabase plugin: <https://rxdb.info/replication-supabase.html>
- PowerSync (alternative): <https://www.powersync.com>

**Yjs:**

- Homepage: <https://yjs.dev>
- Docs: <https://docs.yjs.dev>

---

## Enterprise Features & Compliance

This section covers what's needed beyond the basic MoR stack to sell into enterprises and financial institutions.

### Penpot Pricing Model (Reference)

[Penpot](https://penpot.app/pricing) uses a simple, flat pricing model with capped monthly costs:

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | $0 | Unlimited teams, designers, files; community support |
| Professional | Max $175/mo (capped) | Preferred hosting region, premium support, 25GB storage |
| Enterprise | Max $950/mo (capped) | SSO/SAML, 2FA, team access controls, audit logs, self-hosted option |

**Key insight**: Capped monthly pricing regardless of team size gives enterprises budget predictability.

---

### Enterprise Feature Requirements

When selling to financial institutions and large enterprises:

#### Tier 1: Must-Have (Deal Breakers)

| Feature | Why Required | Turnkey Solution |
|---------|--------------|------------------|
| SSO/SAML | 83% of enterprise buyers require before vendor onboarding | Clerk (built-in), WorkOS, BoxyHQ |
| SOC 2 Type II | Industry standard; often contractual requirement | Vanta, Drata, Secureframe |
| Audit Logging | Regulatory compliance (SOX, GLBA, DORA) | [Retraced](https://github.com/retracedhq/retraced) (free, OSS) |
| Data Encryption | At rest and in transit; non-negotiable | Standard TLS + cloud provider |
| MFA/2FA | Basic security requirement | Clerk (built-in) |

#### Tier 2: Strongly Expected

| Feature | Why Required | Turnkey Solution |
|---------|--------------|------------------|
| SCIM Provisioning | Auto user sync with corporate directory | WorkOS, BoxyHQ |
| Role-Based Access Control | Granular permissions within teams | Permit.io, Cerbos, or built-in |
| Data Residency Options | GDPR, regional compliance | Multi-region cloud deployment |
| SLA/Uptime Guarantees | Contractual requirements | Your operational commitment |

---

### Turnkey Enterprise Platforms

#### SSO/SAML: Clerk (Recommended) or WorkOS

**Clerk** (already in your stack):

- SSO/SAML available on Pro tier
- No additional vendor needed
- Includes MFA, Organizations, RBAC

**WorkOS** (if you need more enterprise polish):

- $125 per SSO/SCIM connection
- Supports all major IdPs (Okta, Azure AD, Google Workspace)
- Per-connection costs add up with many enterprise customers

#### Audit Logging: Retraced by BoxyHQ

- **Pricing**: Free (open source)
- **Features**: Embeddable UI, Kubernetes-ready, searchable/exportable logs
- **Why needed**: SOC 2, SOX, GLBA compliance all require audit trails
- **GitHub**: <https://github.com/retracedhq/retraced>

#### SOC 2 Compliance Automation

| Platform | Starting Price | Best For |
|----------|---------------|----------|
| Secureframe | $7,500/year | Budget-conscious, fast certification |
| Vanta | $11,500/year | Most integrations (375+), polished |
| Drata | $7,500-15,000/year | Multi-framework, growing enterprises |

**Key stat**: 83% of enterprise buyers require SOC 2 before vendor onboarding.

**Recommendation**: Defer SOC 2 until enterprise customers demand it (~$15-30k total investment).

---

### Financial Services-Specific Requirements

Beyond general enterprise needs, financial institutions may require:

| Requirement | Framework | How to Address |
|-------------|-----------|----------------|
| Customer data protection | GLBA (US) | Encryption, access controls, audit logs |
| Cybersecurity program | 23 NYCRR 500 (NY) | SOC 2 covers most requirements |
| Operational resilience | DORA (EU) | Incident response, testing |
| Record retention | SEC-17 4a | Audit logs with 6-year retention |

**Key insight**: Most financial regulations are satisfied by SOC 2 + SSO + audit logging.

---

### Final Pricing Strategy

Based on competitor research (see [Competitor Pricing Analysis](#competitor-pricing-analysis)):

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 project, 5 bounded contexts, full collaboration |
| **Pro** | $99/year | Unlimited projects, unlimited contexts |
| **Enterprise** | Custom | SSO/SAML, audit logs, SLA, priority support |

**Key principles:**

- Collaboration/sync works for ALL tiers (already built)
- Tiers differ only in quantity limits, not feature lockouts
- License tied to project owner - collaborators don't need licenses
- $99/year is competitive with Miro/Excalidraw ($72-96/year range)
- Team tier deferred until customer demand validates it

---

### Implementation Phases

#### Phase 1: Validation (Current)

- Polar.sh + Clerk + Simple Analytics
- Free + Pro tiers only
- Quantity-based limits (projects, contexts)

#### Phase 2: Enterprise-Ready (When demanded)

- Enable Clerk SSO/SAML (already available in Clerk Pro)
- Integrate Retraced for audit logging (free, OSS)
- Launch Enterprise tier
- Create security questionnaire responses

#### Phase 3: SOC 2 (When required for deals)

- Complete SOC 2 Type II certification ($15-30k)
- Switch to Paddle/FastSpring if enterprise billing needed
- Only pursue if enterprise customers require it

---

### Enterprise Resources

**SSO/Identity**:

- [WorkOS SSO Guide](https://workos.com/blog/the-best-5-sso-providers-to-power-your-saas-app-in-2025)
- [BoxyHQ SaaS Starter Kit](https://github.com/boxyhq/saas-starter-kit)

**Compliance**:

- [SOC 2 Compliance Checklist](https://secureleap.tech/blog/soc-2-compliance-checklist-saas)
- [SSO Implementation Requirements](https://ssojet.com/ciam-101/sso-implementation-checklist-enterprise-security-requirements-for-b2b-saas)
- [Financial Services Compliance](https://endgrate.com/blog/saas-compliance-for-financial-services-10-key-requirements)

**Audit Logging**:

- [Retraced GitHub](https://github.com/retracedhq/retraced)
- [Enterprise Ready Audit Log Guide](https://www.enterpriseready.io/features/audit-log/)

---

## Technical Requirements (Blocking Issues)

### Durable Object Authentication (CRITICAL)

**Current state:** `workers/server.ts` has NO user authentication.

**Issue:** The `YjsRoom` class extends `YServer` with no auth checks:

- Anyone with a project ID can connect and edit
- No user ID associated with projects
- No tier verification at sync layer

**This is a blocking security issue** - must be fixed before SaaS launch.

---

### Correct Authentication Architecture

**Problem:** The original plan suggested "add JWT verification in `onConnect()`" but y-partyserver doesn't provide an `onConnect()` hook for pre-flight validation. WebSocket connections are established before you can validate.

**Solution:** Validate in Worker fetch handler BEFORE routing to Durable Object:

```typescript
// workers/server.ts - fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      const url = new URL(request.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response('Unauthorized: Missing token', { status: 401 });
      }

      // Verify Clerk JWT BEFORE routing to DO
      const verified = await verifyClerkJWT(token, env.CLERK_SECRET_KEY);
      const userId = verified.sub;

      // Check project access against D1
      const projectId = url.searchParams.get('room');
      const hasAccess = await checkProjectAccess(projectId, userId, env);
      if (!hasAccess) {
        return new Response('Forbidden: No access to project', { status: 403 });
      }

      // Pass verified userId to DO (DO trusts Worker validation)
    }

    return await routePartykitRequest(request, env);
  }
}
```

**Required infrastructure:**

- D1 database for `project_ownership` + `project_collaborators` tables
- KV namespace for webhook idempotency
- Clerk SDK for JWT verification in Worker

---

### Server-Side Tier Enforcement (CRITICAL)

**Problem:** The original plan stated "Accept client-side gates as primary defense, server-side is audit-only." This is trivially bypassed by modifying JavaScript or replaying WebSocket messages.

**Solution:** Validate BEFORE applying Yjs updates in `onMessage()`:

```typescript
// workers/server.ts - YjsRoom class
async onMessage(connection: Connection, message: Uint8Array): Promise<void> {
  const userId = connection.metadata.userId;
  const userTier = this.userTiers.get(userId);

  // Decode Yjs message to inspect what's changing
  const decoded = decodeYjsUpdate(message);

  if (decoded.type === 'update') {
    // Simulate update on temporary doc to check tier violation
    const wouldViolate = await this.wouldViolatePolicy(decoded, userId, userTier);

    if (wouldViolate) {
      connection.send(JSON.stringify({
        type: 'error',
        code: 'TIER_LIMIT_EXCEEDED',
        message: 'Upgrade to Pro for unlimited contexts'
      }));
      return; // Don't apply the update
    }
  }

  super.onMessage(connection, message);
}
```

**Three-layer gate architecture:**

| Layer | Purpose | Location |
|-------|---------|----------|
| **UI** | User feedback (disabled buttons) | `src/utils/featureGates.ts` |
| **Yjs helpers** | Developer safety (throw errors) | `src/model/mutations.ts` |
| **Server** | Security (reject WebSocket messages) | `workers/server.ts` |

---

### Webhook Handler Requirements

**File:** `workers/webhook.ts`

**Security requirements:**

1. **HMAC-SHA256 signature verification** - Verify `X-Polar-Signature` header
2. **Timestamp validation** - Reject if >5 minutes old (prevent replay attacks)
3. **Idempotency** - Store processed event IDs in KV namespace (7-day TTL)
4. **Retry logic** - Exponential backoff (1s, 2s, 4s) if Clerk API fails
5. **Failed webhook queue** - Store in KV or D1 for manual resolution

**Events to handle:**

| Event | Action |
|-------|--------|
| `subscription_created` | Set tier: "pro" in Clerk metadata |
| `subscription_cancelled` | Set tier: "free" in Clerk metadata |
| `subscription_updated` | Update tier based on new plan |

---

### Pricing Validation (BEFORE Launch)

**Risk:** $99/year may be too low for target persona. At $150-300/hr, this is 4-8 minutes of billable time - signals "toy tool" not "professional instrument."

**Validation steps:**

1. Interview 10 target consultants: "How much would you pay?"
2. A/B test landing page: $99/year vs $299/year
3. Ask beta users: "What's your max price before you wouldn't buy?"

**Alternative pricing to test:**

- $299/year (still easy to expense, signals professionalism)
- $29/month ($348/year effective, lower initial commitment)
- $99/year + $49/project (usage-based component)

---

### Product Gaps to Address

**Workshop facilitation features (if this is the value prop vs Context Mapper):**

- Presentation mode (hide UI chrome, full-screen canvas)
- Facilitator controls (lock/unlock editing for participants)
- Workshop templates (pre-built starter maps)
- Timer/agenda integration

**Virality mechanics (critical for word-of-mouth growth):**

- "Made with ContextFlow" footer on Free tier projects
- Referral program ("Invite 3 consultants, get 3 months free")
- Public gallery of example maps (SEO + social proof)

**Data portability:**

- Local-only project mode for compliance-sensitive clients
- GDPR data export endpoint (all user data, not just current project)

---

*Last updated: 2025-12-07*
