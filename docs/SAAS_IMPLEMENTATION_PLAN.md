# SaaS Monetization: User-Flow-First Implementation

**Created:** 2025-12-07
**Status:** Reviewed - Milestone 0 is MVP path
**Prerequisites:** Cloud sync via Yjs + Cloudflare Durable Objects (already implemented)

---

## Philosophy

**Build by complete user journey, not technical component.**

Each flow is fully E2E testable before moving to the next. This prevents:

- Building perfect auth with no conversion context
- Payment integration without knowing what triggers purchases
- Feature gates without understanding user behavior

---

## Target Users

**Primary:** Solo architect-consultant ($150-300/hr billing rate)

- Job: "Make the invisible visible" in 2-4 hour client workshops
- Conversion trigger: First successful workshop + client asks to share the map
- Why $99/year: Competitive with Miro/Excalidraw ($72-96/year range), pays for itself quickly

> **⚠️ NEEDS VALIDATION:** The assumed trigger "first successful workshop + client asks to share" may be incorrect. Consultants likely pay BEFORE workshops to avoid friction in front of clients. The real trigger may be "I have a client workshop scheduled next week." Validate with 10 user interviews before launch.

**Secondary:** Internal architecture lead at mid-size company

- Job: Communicate system boundaries to non-technical stakeholders
- Conversion trigger: Leadership asks for "living documentation"

---

## Pricing Model

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 project, unlimited contexts, full collaboration |
| **Pro** | $99/year | Unlimited projects |
| **Enterprise** | Custom | SSO/SAML, audit logs, SLA, priority support |

> **⚠️ PRICING NEEDS VALIDATION:** $99/year is 4-8 minutes of billable time for target persona ($150-300/hr). This may signal "toy tool" rather than "professional instrument." Consider testing:
>
> - $299/year (still easy to expense, signals professionalism)
> - $29/month ($348/year effective, lower commitment)
> - $99/year + $49/project (usage-based component)
>
> A/B test on landing page before committing to price.

**Key principle:** Collaboration/sync works for ALL tiers. Tiers differ only in quantity limits, not feature lockouts. Users upgrade naturally when they need more projects.

### Licensing Model

**You pay for what you own, not what you collaborate on.**

- License is tied to the **project owner**, not collaborators
- Anyone can collaborate on a shared project, regardless of their own tier
- Free users can participate in unlimited Pro-owned workshops
- Free users hit limits only when creating their **own** projects

### Project Limit Enforcement

- Free tier: 1 owned project (samples and shared projects don't count)
- Upgrade prompt when user tries to create second project
- No context limits on any tier

---

## Milestone 0: Minimal Path

**Goal:** Ship the core payment journey with minimum infrastructure. Validate that people will pay before building production-grade systems.

**Core journey:**

```text
[User visits app] → [Signs up via Clerk] → [Creates 1 project (Free tier)]
→ [Hits project limit] → [Clicks "Upgrade"] → [Polar checkout]
→ [Pays $99] → [Webhook fires] → [Pro unlocked] → [Creates unlimited projects]
```

### Step 1: Clerk Integration

**What to build:**

1. `ClerkProvider` wrapper in `src/main.tsx`
2. `<SignIn>` / `<UserButton>` components in TopBar
3. User state in Zustand store (`userId`, `email`, `tier`, `isLoading`)
4. `useAuthSync` hook to sync Clerk → Zustand

**Files:**

- `src/main.tsx` - ClerkProvider wrapper
- `src/components/TopBar.tsx` - sign in/out UI
- `src/model/store.ts` - user state fields
- `src/model/storeTypes.ts` - UserState interface
- `src/hooks/useAuthSync.ts` - sync Clerk → Zustand (new)

### Step 2: Worker Auth + Tier Gates

**What to build:**

1. JWT validation in `workers/server.ts` fetch handler (before routing to DO)
2. Extract tier from Clerk JWT claims
3. Block project creation if free tier + already owns 1 project
4. Client-side UI gates (disabled buttons, upgrade prompts)

**Files:**

- `workers/server.ts` - JWT validation in fetch handler
- `src/utils/featureGates.ts` - tier checking helpers (new)
- `src/components/UpgradePrompt.tsx` - upgrade modal (new)

**Tier storage:** Use Clerk user metadata instead of D1 database:

```typescript
// Clerk privateMetadata structure
{
  "subscription": {
    "tier": "free" | "pro",
    "polarSubscriptionId": "sub_xxx"  // optional
  },
  "ownedProjects": ["proj_abc123"]  // array of project IDs
}
```

### Step 3: Polar Webhook

**What to build:**

1. Create Polar.sh product ($99/year) in test mode
2. Checkout link that passes `clerk_user_id` in metadata
3. Simple webhook handler using `@polar-sh/sdk`

**Webhook handler (~50 lines):**

```typescript
// workers/webhook.ts
import { validateEvent } from '@polar-sh/sdk/webhooks';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const signature = request.headers.get('Polar-Signature');
    const body = await request.text();

    // SDK handles signature verification
    const event = await validateEvent(body, signature, env.POLAR_WEBHOOK_SECRET);

    if (event.type === 'subscription.created') {
      const clerkUserId = event.data.metadata?.clerk_user_id;
      // Update Clerk metadata: tier = "pro"
      await updateClerkMetadata(clerkUserId, { tier: 'pro' }, env);
    }

    if (event.type === 'subscription.canceled') {
      const clerkUserId = event.data.metadata?.clerk_user_id;
      // Update Clerk metadata: tier = "free"
      await updateClerkMetadata(clerkUserId, { tier: 'free' }, env);
    }

    return new Response('OK', { status: 200 });
  }
};
```

**Files:**

- `workers/webhook.ts` - Polar webhook handler (new)
- `wrangler.toml` - webhook route + secrets

### What to Skip (Defer to Milestone 1)

| Item | Why Skip | When to Add |
|------|----------|-------------|
| D1 database | Clerk metadata sufficient for <100 users | Milestone 1 |
| Server-side Yjs validation | Client-side gates fine for trusted early users | Milestone 1 |
| Structured logging | console.log works for debugging | Milestone 1 |
| Rate limiting code | Use Cloudflare dashboard instead (no code) | Milestone 1 |
| Webhook idempotency (KV) | Polar retries are rare, manual fix OK | Milestone 1 |
| Input validation (1MB) | Add if abuse detected | Milestone 1 |

### Minimum Security (Do Immediately)

Before launching Milestone 0, configure in Cloudflare dashboard (no code):

1. **Billing alert** - $50/day threshold notification
2. **Spending cap** - $200/month hard limit
3. **Rate limiting rule** - 100 requests/min per IP to `/parties/*`

### Milestone 0 Complete When

- [ ] User can sign up via Clerk
- [ ] Free tier user can create 1 project
- [ ] Upgrade prompt appears when creating 2nd project
- [ ] Payment via Polar test mode succeeds
- [ ] Webhook updates Clerk metadata
- [ ] Pro user can create unlimited projects

---

## Milestone 1: Production Hardening

> **When to implement:** After 50+ customers, or when manual processes become painful.

This milestone adds production-grade infrastructure that's overkill for early validation but necessary for scale.

### Security & Auth

| Item | Details |
|------|---------|
| Auth validation in Worker layer | Verify Clerk JWT in fetch handler BEFORE routing to Durable Object |
| Server-side tier enforcement | Use compensating transactions in `onMessage()` - accept update, detect violation, apply undo |
| Input validation | Max message size (1MB) for Yjs updates to prevent DoS |
| Token revocation | Short-lived tokens (15min) with refresh, or KV blocklist for stolen JWTs |
| JWT expiry during WebSocket | Long workshops outlive tokens. Need refresh strategy or long-lived WebSocket tokens |
| Rate limiting (code) | Per-connection and per-operation limits beyond dashboard config |
| CORS configuration | Required for browser WebSocket connections |
| Cache invalidation auth | Protect webhook cache invalidation endpoint |

### Infrastructure

| Item | Details |
|------|---------|
| D1 database | Tables for `project_ownership` and `project_collaborators` (Clerk metadata insufficient at scale) |
| Webhook hardening | Signature verification, timestamp validation, idempotency (KV), retry logic |
| Structured logging | JSON format for Cloudflare Logpush integration |
| Monitoring/observability | Logs, alerts, dashboards. Billing alerts ($50/day threshold) |
| Backup/recovery | R2 daily snapshots + recovery runbook for DO corruption |
| Yjs schema versioning | Version in doc + force-refresh for old clients to prevent data corruption |
| Garbage collection | `lastAccessedAt` + 90-day cleanup with email warning for abandoned projects |
| Clerk outage fallback | Cache JWTs for 1hr, allow anonymous mode as degraded fallback |
| Webhook failure detection | Monitoring + manual replay endpoint if Polar webhooks fail silently |

### Operations

| Item | Details |
|------|---------|
| Environment separation | Separate Clerk apps (dev/staging/prod) and Polar products (test/live mode) |
| Local dev docs | Document 4+ service setup or provide mocks |
| Client/server version mismatch | Version check + "Please refresh" prompt for old tabs |
| WebSocket limits | Load test max concurrent connections per DO before launch |

**D1 Schema:**

```sql
CREATE TABLE project_ownership (
  project_id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_owner ON project_ownership(owner_user_id);

CREATE TABLE project_collaborators (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'owner' | 'editor' | 'viewer'
  added_at INTEGER NOT NULL,
  PRIMARY KEY (project_id, user_id)
);
```

**Files:**

- `workers/server.ts` - auth in fetch handler, onMessage validation, CORS
- `workers/webhook.ts` - Polar webhook handler (new file)
- `wrangler.toml` - D1 database, KV namespace bindings
- `migrations/` - D1 schema migrations

**E2E Test:**

- Unauthenticated WebSocket connection is rejected with 401
- Invalid JWT is rejected with 401
- User without project access is rejected with 403
- Webhook with invalid signature is rejected
- Duplicate webhook (same event ID) is handled idempotently

---

## Milestone 2: Full User Flows

> **When to implement:** After Milestone 0 payment flow is validated and working.

Polish the complete user experience with all edge cases handled.

### Flow 1: Anonymous Visitor → Demo Exploration

**Goal:** Prove the product delivers value before requiring any commitment

```text
[Visit contextflow.app] → [See WelcomeModal] → [Load sample project]
→ [Explore canvas: pan, zoom, switch views] → [Click around for 5-10 min]
→ [Try to edit something] → [See "Sign in to edit" prompt]
```

**What to build:**

1. Anonymous access to sample projects (already works)
2. Clear "view-only" indicator for anonymous users
3. Soft prompt when attempting edit: "Sign in to start creating"

**E2E Test:**

- Anonymous user can load sample project
- Can switch views, click nodes, read inspector
- Attempting edit shows sign-in prompt (not hard block)
- No errors in console

**Files:**

- `src/components/TopBar.tsx` - show "Sign In" button when anonymous
- `src/App.tsx` - handle anonymous state gracefully

---

### Flow 2: Sign Up → Free Tier Experience

**Goal:** Get user signed in, establish baseline "free" experience with limited creation

```text
[Click "Sign In"] → [Clerk sign-up form] → [Create account]
→ [Return to app as Free user] → [Can create 1 project]
→ [Create first project] → [Add unlimited bounded contexts]
→ [Try to create second project] → [See "Upgrade to Pro" prompt]
```

**What to build:**

1. Clerk integration (ClerkProvider, sign in/out UI)
2. User state in Zustand store (userId, tier, isLoading)
3. Free tier limits: 1 project (unlimited contexts)
4. Upgrade prompts when hitting project limit

**E2E Test:**

- User can sign up via Clerk
- After sign-up, returns to app with identity preserved
- Free tier user can create and edit 1 project with unlimited contexts
- Attempting to create second project shows upgrade prompt
- User appears in Clerk dashboard

**Files:**

- `src/main.tsx` - ClerkProvider wrapper
- `src/model/store.ts` - user state fields
- `src/model/storeTypes.ts` - UserState interface
- `src/hooks/useAuthSync.ts` - sync Clerk → Zustand
- `src/components/TopBar.tsx` - sign in/out UI
- `src/components/UpgradePrompt.tsx` - upgrade modal

---

### Flow 3: Free User → Purchase → Pro Unlock

**Goal:** Complete purchase flow, prove payment → feature unlock works

```text
[Free user hits project limit] → [See "Upgrade to Pro" prompt]
→ [Click "Subscribe $99/year"] → [Polar checkout opens]
→ [Enter payment (test card 4242...)] → [Payment succeeds]
→ [Webhook fires] → [Clerk metadata updated] → [Return to app]
→ [Pro features unlocked] → [Create unlimited projects]
```

**What to build:**

1. Polar.sh product setup (test mode)
2. Checkout link integration (pass clerk_user_id in metadata)
3. Webhook handler (Cloudflare Worker) - already built in Phase 0
4. Clerk metadata update on payment
5. **Payment success page** with tier verification polling
6. **"Processing..." state** while waiting for webhook (retry every 2s, max 30s)
7. **Fallback UX**: "Payment received, refreshing..." if webhook delayed beyond 30s

**E2E Test:**

- Free user clicks upgrade, sees Polar checkout
- Payment with test card succeeds
- User returns to success page, sees "Verifying payment..."
- Webhook processes, Clerk metadata updated
- Success page detects tier change, redirects to app
- App shows Pro features unlocked
- User can create new project
- **Edge case:** Webhook delayed 45 seconds - user sees helpful message, not error

**Files:**

- `workers/webhook.ts` - Polar webhook handler (Phase 0)
- `wrangler.toml` - webhook worker config
- `src/pages/PaymentSuccess.tsx` - success page with polling (new)
- `src/components/UpgradePrompt.tsx` - checkout link
- `src/utils/featureGates.ts` - tier checking helpers (UI layer)

---

### Flow 4: Pro User → Create & Edit Project

**Goal:** Prove core Pro experience works end-to-end

```text
[Pro user opens app] → [Click "New Project"] → [Enter project name]
→ [Empty canvas appears] → [Add bounded context] → [Edit properties]
→ [Add relationship] → [Project auto-saves to cloud]
→ [Close browser] → [Reopen] → [Project persists]
```

**What to build:**

1. "New Project" flow for Pro users
2. Feature gates on create/edit/delete actions
3. Verify cloud sync works with new projects

**E2E Test:**

- Pro user can create new project
- Can add/edit/delete bounded contexts
- Can add relationships
- Changes sync to cloud (verify in DO)
- Reopening browser shows same project

**Files (Three-Layer Gate Architecture):**

- `src/utils/featureGates.ts` - tier checking helpers (UI layer - disabled buttons, upgrade prompts)
- `src/model/mutations.ts` - Yjs mutation wrappers with tier checks (developer safety layer - throw errors)
- `workers/server.ts` - onMessage validation (security layer - reject WebSocket messages)
- `src/components/ContextNode.tsx` - respect UI gates
- `src/components/InspectorPanel.tsx` - show/hide edit controls based on tier

**Note:** Do NOT add mutation logic to `store.ts` - Zustand is a read-only projection per ARCHITECTURE.md.

---

### Flow 5: Pro User → Share → Recipient Views

**Goal:** Prove viral sharing loop works

```text
[Pro user clicks "Share"] → [Copy project URL] → [Send to colleague]
→ [Colleague opens URL] → [Project loads (no sign-in required)]
→ [Colleague can view and collaborate on shared project]
→ [Colleague signs up] → [Gets Free tier: can create their own project]
```

**What to build:**

1. Shareable project URLs (already implemented via ShareProjectDialog)
2. Anonymous/free users can view AND collaborate on shared projects
3. Signing up gives them their own Free tier quota (1 project)

**E2E Test:**

- Pro user generates share link
- Anonymous recipient can open link and view project
- Recipient can collaborate (edit) on the shared project
- Recipient signs up → gets own Free tier with 1 project quota

**Files:**

- `src/components/ShareProjectDialog.tsx` - verify works
- `src/App.tsx` - handle shared project loading for anonymous users

---

## Edge Cases (Implement AFTER happy paths work)

### Edge Case A: Returning Pro User

- User with existing Pro subscription returns
- Clerk loads user → metadata has tier: "pro"
- App unlocks Pro features immediately

### Edge Case B: Subscription Expires

- Pro user's subscription lapses
- Polar webhook fires (subscription_cancelled)
- Clerk metadata updated to tier: "free"
- Next app load enforces Free tier limits
- Existing projects preserved but user can only edit 1 project (oldest or most recent)

### Edge Case C: Payment Fails

- User starts checkout but payment fails
- Polar shows error, user remains on Free tier
- No webhook fires (nothing to handle)

### Edge Case D: Offline During Purchase

- User completes Polar checkout
- Network drops before webhook completes
- Polar retries webhook (built-in)
- User sees "Payment processing..." until confirmed

---

## Environment Setup (Do First)

### External Accounts

- [ ] Clerk: Create "ContextFlow Dev" and "ContextFlow Prod" apps
- [ ] Polar.sh: Create test product ($99/year)

### Environment Variables

```bash
# .env.development (gitignored)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_POLAR_CHECKOUT_URL=https://polar.sh/checkout/...
```

### Cloudflare Secrets

```bash
wrangler secret put POLAR_WEBHOOK_SECRET --env staging
wrangler secret put CLERK_SECRET_KEY --env staging
```

---

## Success Criteria

### Flow 1 Complete

- [ ] Anonymous user can explore sample project
- [ ] Edit attempt shows sign-in prompt

### Flow 2 Complete

- [ ] User can sign up via Clerk
- [ ] Free tier can create 1 project with unlimited contexts
- [ ] Upgrade prompt appears when trying to create second project

### Flow 3 Complete

- [ ] Test purchase completes end-to-end
- [ ] Webhook updates Clerk metadata
- [ ] Pro features unlock without manual intervention

### Flow 4 Complete

- [ ] Pro user can create/edit/delete projects
- [ ] Changes persist across sessions

### Flow 5 Complete

- [ ] Share URL works for anonymous recipients
- [ ] Recipients can collaborate on shared projects
- [ ] Signing up gives recipient their own Free tier quota

---

## Files Changed (By Flow)

### Flow 1 (Anonymous)

- `src/components/TopBar.tsx`
- `src/App.tsx`

### Flow 2 (Sign Up + Free Tier)

- `src/main.tsx`
- `src/model/store.ts`
- `src/model/storeTypes.ts`
- `src/hooks/useAuthSync.ts`
- `src/components/TopBar.tsx`
- `src/components/UpgradePrompt.tsx`

### Flow 3 (Purchase)

- `workers/webhook.ts` (new)
- `wrangler.toml`
- `src/components/UpgradePrompt.tsx`
- `src/utils/featureGates.ts`

### Flow 4 (Pro Experience)

- `src/model/store.ts`
- `src/components/ContextNode.tsx`
- `src/components/InspectorPanel.tsx`

### Flow 5 (Sharing)

- Minimal changes (verify existing ShareProjectDialog works)

---

## Pre-Launch Checklist

> **When to address:** Before marketing or accepting real payments. Not blockers for M0/M1 validation.

### Legal & Compliance

| Item | Details |
|------|---------|
| Terms of Service | Data classification, IP ownership ("User retains all IP rights to content"), liability |
| Privacy Policy | GDPR-compliant, data retention on subscription lapse |
| GDPR deletion flow | Procedure to delete user data across DO + D1 + Clerk + Polar within 30 days |
| Collaboration consent | Consent modal for GDPR co-controller compliance when joining others' projects |
| Refund policy | EU 14-day cooling-off period |
| Cross-border data | Cloudflare global edge vs Schrems II. SCCs for EU users |

### UX Polish

| Item | Details |
|------|---------|
| First-run experience | First 60 seconds (landing → "aha moment"). What do new users see? |
| Project ownership transfer | Free user creates project, Pro consultant takes over for workshop |
| Multi-tab upgrade detection | BroadcastChannel + forced refresh when tier changes |
| Over-limit downgrade UX | Which project stays editable when Pro → Free? |
| Per-project connection limits | Prevent 500 people joining one session |

### Business Validation (Ongoing)

| Item | Details |
|------|---------|
| Conversion trigger validation | Interview 10 users. Is it "after workshop" or "before workshop"? |
| Acquisition strategy | Pick ONE channel and commit. Where do customers come from? |
| Pricing validation | A/B test $99 vs $299 vs $29/month on landing page |
| Free tier arbitrage | Monitor if collaborator limits needed (50 consultants sharing 1 Pro license) |
| Churn risk | "Use once" tools need retention mechanics. Why pay year 2? |
| Failure criteria | Define: "If <10 customers in 90 days, revisit strategy" |

### Analytics

| Item | Details |
|------|---------|
| Instrumentation plan | How to measure CAC, conversion, churn, activation |
| Payment funnel tracking | Custom events for off-site Polar checkout |
| Tier state sync | Document authoritative source: Clerk metadata → Zustand → DO cache |

---

## Success Metrics (Define BEFORE Launch)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **CAC** | <$50 | Marketing spend / new paying customers |
| **Conversion rate** | 10% in 90 days | Free users who upgrade to Pro |
| **Churn rate** | <20% annual | Subscriptions cancelled / total active |
| **Activation rate** | 70% in 7 days | Signups who create a project |

**Review cadence:** Check metrics at 50 and 100 paying customers.

**If targets not met:**

- Conversion <5%: Revisit conversion triggers, interview churned users
- Churn >30%: Add pause/resume billing, investigate seasonal patterns
- Activation <50%: Improve onboarding, add templates

---

## Resolved Decisions

These have been decided and don't need further discussion:

- **Project-based limits** - Free tier limited to 1 owned project with unlimited contexts. Context limits removed. Simpler model that lets users experience full DDD workshops.
- **Sample project handling** - Samples are platform-owned, editable by all users, don't count against project limit. Changes saved to user's local IndexedDB.
- **Project limit enforcement** - Show upgrade modal when limit reached, allow user to cancel. No hard block mid-action.
- **Downgrade behavior** - Most recently edited project stays editable, others read-only. User can switch active project in settings.
- **Anonymous → authenticated migration** - On sign-up, show "Save this project?" prompt. Transfer ownership or GC if declined.
- **Feature gate architecture** - Three layers: UI (disabled buttons) → Yjs mutation helpers (throw errors) → Server validation (project count only).

---

## Related Documentation

- [SAAS_MONETIZATION_STRATEGY.md](SAAS_MONETIZATION_STRATEGY.md) - Research and decisions
- [CLOUD_SYNC_PLAN.md](CLOUD_SYNC_PLAN.md) - Already implemented sync architecture
