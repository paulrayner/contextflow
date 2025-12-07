# SaaS Monetization: User-Flow-First Implementation

**Created:** 2025-12-07
**Status:** Ready for Implementation
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
- Why $299/year: Tool pays for itself in 1-2 hours of saved time

**Secondary:** Internal architecture lead at mid-size company

- Job: Communicate system boundaries to non-technical stakeholders
- Conversion trigger: Leadership asks for "living documentation"

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

**Goal:** Get user signed in, establish baseline "free" experience

```text
[Click "Sign In"] → [Clerk sign-up form] → [Create account]
→ [Return to app as Free user] → [Can still view sample projects]
→ [Try to create project] → [See "Upgrade to Pro" prompt]
→ [Try to export] → [See "Upgrade to Pro" prompt]
```

**What to build:**

1. Clerk integration (ClerkProvider, sign in/out UI)
2. User state in Zustand store (userId, tier, isLoading)
3. Free tier = view-only (same as anonymous, but tracked)
4. Upgrade prompts at gate points

**E2E Test:**

- User can sign up via Clerk
- After sign-up, returns to app with identity preserved
- Free tier user sees same view-only experience
- Attempting create/edit/export shows upgrade prompt
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
[Free user clicks "Upgrade to Pro"] → [See pricing/benefits]
→ [Click "Subscribe $299/year"] → [Polar checkout opens]
→ [Enter payment (test card 4242...)] → [Payment succeeds]
→ [Webhook fires] → [Clerk metadata updated] → [Return to app]
→ [Pro features unlocked] → [Create first project]
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
→ [Colleague explores in view-only mode]
→ [Colleague tries to edit] → [See "Get Pro to collaborate" prompt]
```

**What to build:**

1. Shareable project URLs (already implemented via ShareProjectDialog)
2. Anonymous/free users can view shared projects
3. Edit attempts on shared projects show upgrade prompt

**E2E Test:**

- Pro user generates share link
- Anonymous recipient can open link and view project
- View-only mode enforced for non-Pro viewers
- Upgrade prompt shown when trying to edit

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
- Next app load shows view-only mode
- Existing projects preserved (read-only)

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
- [ ] Polar.sh: Create test product ($299/year)

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
- [ ] Free tier enforced (view-only)
- [ ] Upgrade prompts appear at gate points

### Flow 3 Complete

- [ ] Test purchase completes end-to-end
- [ ] Webhook updates Clerk metadata
- [ ] Pro features unlock without manual intervention

### Flow 4 Complete

- [ ] Pro user can create/edit/delete projects
- [ ] Changes persist across sessions

### Flow 5 Complete

- [ ] Share URL works for anonymous recipients
- [ ] View-only enforced for non-Pro viewers

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
