# SaaS Monetization: User-Flow-First Implementation

**Created:** 2025-12-07
**Status:** Ready for Implementation
**Prerequisites:** Cloud sync via Yjs + Cloudflare Durable Objects (already implemented)

---

## Open Questions (Review Before Implementation)

### Critical Technical Issues

- [ ] **No auth in Durable Objects** - `workers/server.ts` has zero authentication. Anyone with a project ID can connect and edit. Must add JWT verification in `onConnect()`.
- [ ] **No webhook handler** - Need to implement `workers/webhook.ts` for Polar → Clerk sync with signature verification and replay protection.
- [ ] **No monitoring/observability** - No logs, alerts, or dashboards. Need structured logging, Cloudflare Logpush, and basic alerting.
- [ ] **No backup/recovery** - No soft-delete, no snapshots. Need 30-day retention and recovery runbook.
- [ ] **Yjs mutation rejection** - Yjs CRDTs don't support conditional mutations. Accept client-side gates as primary defense, server-side is audit-only.

### Infrastructure Setup

- [ ] **Environment separation** - Need separate Clerk apps (dev/staging/prod) and Polar products (test/live mode).
- [ ] **Secret management** - Document how to set `CLERK_SECRET_KEY`, `POLAR_WEBHOOK_SECRET` via wrangler secrets.
- [ ] **Local webhook testing** - Document ngrok/cloudflared tunnel setup for testing Polar webhooks locally.

### Product Decisions (Deferred)

- [ ] **Project limit enforcement** - How to handle when free user hits 1 project limit? Block creation or show upgrade prompt?
- [ ] **Downgrade behavior** - When Pro user downgrades to Free with multiple projects, which project stays editable?
- [ ] **Anonymous → authenticated migration** - What happens to anonymous user's edits when they sign up?

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

**Secondary:** Internal architecture lead at mid-size company

- Job: Communicate system boundaries to non-technical stakeholders
- Conversion trigger: Leadership asks for "living documentation"

---

## Pricing Model

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 project, 5 bounded contexts, full collaboration |
| **Pro** | $99/year | Unlimited projects, unlimited contexts |
| **Enterprise** | Custom | SSO/SAML, audit logs, SLA, priority support |

**Key principle:** Collaboration/sync works for ALL tiers. Tiers differ only in quantity limits, not feature lockouts. Users upgrade naturally when they need more projects.

### Licensing Model

**You pay for what you own, not what you collaborate on.**

- License is tied to the **project owner**, not collaborators
- Anyone can collaborate on a shared project, regardless of their own tier
- Free users can participate in unlimited Pro-owned workshops
- Free users hit limits only when creating their **own** projects

### Context Limit Enforcement

- **Warning** at 4 contexts: "You're approaching your free tier limit"
- **Upgrade prompt** at 5 contexts: "Upgrade to Pro for unlimited contexts"
- **Hard block** at 6 contexts: Cannot add more until upgraded or contexts deleted
- Limit is **concurrent**, not lifetime (deleting a context frees up the slot)

---

## User Flows (Implementation Sequence)

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
→ [Create first project] → [Add up to ~5 bounded contexts]
→ [Try to create second project] → [See "Upgrade to Pro" prompt]
→ [Try to add 6th context] → [See "Upgrade to Pro" prompt]
```

**What to build:**

1. Clerk integration (ClerkProvider, sign in/out UI)
2. User state in Zustand store (userId, tier, isLoading)
3. Free tier limits: 1 project, ~5 bounded contexts
4. Upgrade prompts when hitting limits

**E2E Test:**

- User can sign up via Clerk
- After sign-up, returns to app with identity preserved
- Free tier user can create and edit 1 project
- Free tier user can add up to 5 bounded contexts
- Attempting to exceed limits shows upgrade prompt
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
[Free user hits project/context limit] → [See "Upgrade to Pro" prompt]
→ [Click "Subscribe $99/year"] → [Polar checkout opens]
→ [Enter payment (test card 4242...)] → [Payment succeeds]
→ [Webhook fires] → [Clerk metadata updated] → [Return to app]
→ [Pro features unlocked] → [Create unlimited projects]
```

**What to build:**

1. Polar.sh product setup (test mode)
2. Checkout link integration (pass clerk_user_id in metadata)
3. Webhook handler (Cloudflare Worker)
4. Clerk metadata update on payment
5. Real-time tier update in app (or refresh)

**E2E Test:**

- Free user clicks upgrade, sees Polar checkout
- Payment with test card succeeds
- Webhook logged in Cloudflare
- Clerk user metadata shows tier: "pro"
- App shows Pro features unlocked
- User can create new project
- User can export JSON

**Files:**

- `workers/webhook.ts` - new Polar webhook handler
- `wrangler.toml` - webhook worker config
- `src/components/UpgradePrompt.tsx` - checkout link
- `src/utils/featureGates.ts` - tier checking helpers

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

**Files:**

- `src/model/store.ts` - gate mutations by tier
- `src/components/ContextNode.tsx` - respect edit gates
- `src/components/InspectorPanel.tsx` - show/hide edit controls

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
- [ ] Free tier can create 1 project with ~5 bounded contexts
- [ ] Upgrade prompts appear when hitting limits

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

## Related Documentation

- [SAAS_MONETIZATION_STRATEGY.md](SAAS_MONETIZATION_STRATEGY.md) - Research and decisions
- [CLOUD_SYNC_PLAN.md](CLOUD_SYNC_PLAN.md) - Already implemented sync architecture
