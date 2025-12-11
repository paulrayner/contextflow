# SaaS Monetization Strategy for ContextFlow

**Date:** 2025-01-21 (Updated: 2025-12-09)
**Status:** Research Complete - See [SAAS_IMPLEMENTATION_PLAN.md](SAAS_IMPLEMENTATION_PLAN.md) for what to build
**Goal:** Turn-key approach for solo SaaS provider with minimal complexity

---

## Purpose of This Document

This document contains **research, comparisons, and rationale** for monetization decisions. For implementation details (what to build, file changes, code examples), see [SAAS_IMPLEMENTATION_PLAN.md](SAAS_IMPLEMENTATION_PLAN.md).

---

## Table of Contents

1. [Competitor Pricing Analysis](#competitor-pricing-analysis)
2. [Payment Platform Comparison](#payment-platform-comparison)
3. [Authentication Solutions](#authentication-solutions)
4. [Analytics Options](#analytics-options)
5. [Storage Architecture Options](#storage-architecture-options)
6. [Pricing Strategy Rationale](#pricing-strategy-rationale)
7. [Cost Analysis](#cost-analysis)
8. [Enterprise Features Research](#enterprise-features-research)
9. [Resources](#resources)

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

## Payment Platform Comparison

All options below are **Merchant of Record** (MoR) solutions - they handle tax compliance, VAT, invoicing, and payment processing.

### Polar.sh (CHOSEN)

**Best for:** Developer tools, indie hackers, validation phase

**Pros:**

- Cheapest MoR on market (5% flat fee)
- Open source, developer-friendly
- Modern API and beautiful checkout UX
- Growing fast in indie dev community (2024-2025)
- Transparent pricing (no hidden fees)

**Cons:**

- Newer platform (less proven than Paddle/FastSpring)
- Smaller ecosystem

**Pricing:** 5% + payment processing (~3%) = ~8% total

### Alternatives Considered

| Platform | Fees | Best For | Why Not Chosen |
|----------|------|----------|----------------|
| **Lemon Squeezy** | 5% + 50¢ | Solopreneurs | Stripe acquisition uncertainty, subscription lock-in |
| **Paddle** | 5-8% | Enterprise B2B | Overkill for validation, higher fees |
| **Gumroad** | 10% + 50¢ | Quick validation | Too expensive long-term |
| **FastSpring** | Custom | Enterprise sales | Overkill for solo founder |
| **DIY Stripe** | 2.9% + 30¢ | Cost optimization | Tax compliance burden, longer time to market |

---

## Authentication Solutions

### Clerk (CHOSEN)

**Best for:** Drop-in auth, B2B SaaS, fast validation

**Features:**

- Pre-built UI components (`<SignIn>`, `<UserButton>`, `<OrganizationSwitcher>`)
- Multi-tenancy built-in via Organizations
- SSO/SAML support (enterprise-ready)
- 10k MAU free tier

**Pricing:** Free up to 10k MAU, then ~$25/mo

### Supabase Auth (Alternative)

**Features:**

- 50k MAU free tier (100k on Pro)
- Bundled with database, storage
- Row Level Security for authorization
- Requires building own UI

**When to consider:** Cost optimization at scale, if you need Supabase database anyway

### Comparison

| Feature | Clerk | Supabase Auth |
|---------|-------|---------------|
| UI Components | Pre-built | Build your own |
| Free tier | 10k MAU | 50k MAU |
| Multi-tenancy | Built-in Organizations | Custom implementation |
| SSO/SAML | Built-in | Custom setup |
| Best for | Fast validation, B2B | Cost optimization |

---

## Analytics Options

### What Solo Founders Actually Use (2025 Research)

**90% use privacy-first analytics:**

- Simple Analytics, Plausible, or Fathom
- $9-19/mo, simple, GDPR-compliant
- No cookies needed

**10% add product analytics later:**

- PostHog or Mixpanel
- Only after having paying customers

### Simple Analytics (CHOSEN)

**Why:**

- Privacy-first (no cookies, GDPR-compliant)
- Lightweight script (77x smaller than GA)
- $9/mo for 10k visitors
- Used by EventCatalog (3.5k+ stars)

### Alternatives

| Tool | Price | Best For |
|------|-------|----------|
| **Plausible** | $9/mo | Most popular in indie community, self-hosted option |
| **Fathom** | $14/mo | Real-time analytics, polished UX |
| **PostHog** | Free 1M events | Product analytics, A/B testing (add later) |

---

## Storage Architecture Options

### Current State: Yjs + Cloudflare Durable Objects (IMPLEMENTED)

**Architecture:**

- Yjs CRDT for conflict-free real-time collaboration
- IndexedDB (y-indexeddb) for offline persistence
- Cloudflare Durable Objects for WebSocket sync

**Benefits:**

- True multi-user collaboration (real-time)
- Works across devices (cloud-synced)
- Offline editing works (Yjs buffers changes)
- Global low latency (Cloudflare edge)

### Alternatives Evaluated

| Option | Pros | Cons | Status |
|--------|------|------|--------|
| **Supabase + RxDB** | Good free tier, SQL queries | Requires backend, more complex | Not chosen |
| **Dexie Cloud** | Most turnkey, offline-first | Vendor lock-in, unclear pricing | Not chosen |
| **IndexedDB only** | Zero backend | No collaboration | Superseded |

---

## Pricing Strategy Rationale

### Why 3 Tiers (Free/Pro/Enterprise)

Penpot and other successful tools use 3 tiers. Benefits:

- Simpler pricing story
- Lower decision friction
- Collaboration as default feels generous
- Less infrastructure complexity

A Team tier can be added later if customers demand pricing between Pro and Enterprise.

### Why $99/year for Pro

**Rationale:**

- Competitive with Miro/Excalidraw ($72-96/year range)
- Much cheaper than Structurizr ($300/year minimum)
- Easy impulse purchase for consultants

**Risk:** May signal "toy tool" at $150-300/hr billing rate. Consider A/B testing $299/year.

### Why Project-Based Limits (Not Context Limits)

**Decision:** Free tier limited to 1 owned project, unlimited contexts.

**Rationale:**

1. Context limits conflicted with sample projects (9-23 contexts)
2. DDD workshops need full context maps to be useful
3. Project limits create natural upgrade trigger for consultants with multiple clients
4. Full collaboration on free tier differentiates from Structurizr

### Why "Pay for What You Own" Licensing

- License tied to project owner, not collaborators
- Anyone can join shared projects regardless of tier
- Free users can participate in unlimited Pro-owned workshops
- Creates network effects and reduces friction

---

## Cost Analysis

### Monthly Recurring Costs by Phase

| Phase | Users | Clerk | Analytics | Total/mo |
|-------|-------|-------|-----------|----------|
| Validation | 0-100 | $0 | $9 | **$9** |
| Growing | 500 | $25-50 | $9-19 | **$34-69** |
| Scale | 2k+ | $50-100 | $19-29 | **$69-129** |

### Transaction Costs

Polar.sh: 5% + ~3% payment processing = **~8% total**

| ARR | Transaction Fees | Platform Costs | Total | % of Revenue |
|-----|-----------------|----------------|-------|--------------|
| $10k | $800 | $108 | $908 | 9.1% |
| $50k | $4,000 | $408 | $4,408 | 8.8% |
| $100k | $8,000 | $828 | $8,828 | 8.8% |

### Turnkey vs DIY Comparison

**At $50k ARR:**

| Approach | Transaction | Platform | Dev Effort | Total |
|----------|-------------|----------|------------|-------|
| Turnkey (Polar+Clerk) | $4,000 | $408 | Minimal | $4,408 (8.8%) |
| DIY (Stripe+custom) | $1,450 | $800 | Substantial | $2,250 (4.5%) |

**Verdict:** Pay extra ~4% to avoid substantial development work during validation. Consider DIY migration after $250k ARR.

---

## Enterprise Features Research

### When Selling to Enterprises

#### Must-Have (Deal Breakers)

| Feature | Why Required | Solution |
|---------|--------------|----------|
| SSO/SAML | 83% of buyers require it | Clerk (built-in) |
| SOC 2 Type II | Contractual requirement | Vanta/Drata ($7.5-15k/yr) |
| Audit Logging | SOX, GLBA, DORA compliance | Retraced (free, OSS) |
| MFA/2FA | Basic security | Clerk (built-in) |

#### Strongly Expected

| Feature | Solution |
|---------|----------|
| SCIM Provisioning | WorkOS, BoxyHQ |
| Role-Based Access Control | Permit.io, Cerbos, or built-in |
| Data Residency | Multi-region deployment |

### SOC 2 Compliance Platforms

| Platform | Starting Price | Notes |
|----------|---------------|-------|
| Secureframe | $7,500/year | Budget-conscious |
| Vanta | $11,500/year | Most integrations (375+) |
| Drata | $7,500-15,000/year | Multi-framework |

**Recommendation:** Defer SOC 2 until enterprise customers demand it (~$15-30k total investment).

### Financial Services Requirements

Most financial regulations (GLBA, 23 NYCRR 500, DORA) are satisfied by:

- SOC 2 certification
- SSO/SAML
- Audit logging

---

## Resources

### Payment Platforms

- [Polar.sh](https://polar.sh) - [Docs](https://docs.polar.sh)
- [Lemon Squeezy](https://lemonsqueezy.com)
- [Paddle](https://paddle.com)

### Authentication

- [Clerk](https://clerk.com) - [Organizations docs](https://clerk.com/docs/guides/multi-tenant-architecture)
- [WorkOS](https://workos.com) - Enterprise SSO

### Analytics

- [Simple Analytics](https://simpleanalytics.com) - [Docs](https://docs.simpleanalytics.com)
- [Plausible](https://plausible.io)
- [PostHog](https://posthog.com)

### Enterprise Compliance

- [Retraced (Audit Logging)](https://github.com/retracedhq/retraced)
- [SOC 2 Checklist](https://secureleap.tech/blog/soc-2-compliance-checklist-saas)
- [Enterprise Ready Guide](https://www.enterpriseready.io/)

### Real-Time Collaboration

- [Yjs](https://yjs.dev) - [Docs](https://docs.yjs.dev)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)

---

Last updated: 2025-12-09
