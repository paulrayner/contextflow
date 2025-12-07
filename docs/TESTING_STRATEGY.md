# CI/CD Testing Strategy for ContextFlow

## Summary

Build a fast, reliable CI/CD pipeline with strategic E2E tests using Playwright. The existing 1,277 unit tests provide excellent coverage - E2E tests should only cover what *cannot* be tested at lower levels.

**Target pipeline time: < 5 minutes**

---

## Current State

| Aspect | Status |
|--------|--------|
| Unit tests | 1,277 tests (Vitest), ~14s locally |
| E2E tests | None (no Playwright) |
| CI testing | **Not configured** - only builds, no tests |
| Failing tests | 1 (`storeCollabIntegration.test.ts`) |

---

## Test Pyramid Strategy

### Unit Tests (~80%) - Already Well Covered
- Pure functions, store mutations, Yjs sync, validation
- **No new work needed** - existing suite is comprehensive

### Integration Tests (~15%) - Mostly Covered
- Store + Yjs integration, two-browser sync simulation
- Gap: Component integration tests (low priority)

### E2E Tests (~5%) - New Work
**Only test what CANNOT be tested otherwise:**

| Test | Why E2E Required |
|------|------------------|
| Two-Browser Real-Time Sync | Real WebSocket + network timing |
| Offline/Reconnect Flow | Real network disconnection |
| Import File Upload | File system interaction |
| Canvas Drag & Drop | React Flow interaction timing |
| View Transitions | CSS animation timing |

**Minimum: 5-8 E2E tests**

---

## Lessons from EventStormer

Based on the working E2E setup in EventStormer, apply these proven patterns:

### 1. Serial Execution for Collaboration Tests

```typescript
// playwright.config.ts
fullyParallel: false,  // CRITICAL: Yjs syncs state across tests
workers: 1,            // Single worker prevents state conflicts
```

EventStormer learned this the hard way - parallel tests on shared CRDT state cause flaky failures.

### 2. Test Run Isolation

```typescript
// Generate unique project ID per test run
const TEST_RUN_ID = `e2e-${Date.now()}`

// Use in tests to avoid accumulation in cloud storage
const projectId = `test-project-${TEST_RUN_ID}`
```

### 3. Explicit Wait Functions Over Timeouts

```typescript
// BAD - arbitrary sleep
await page.waitForTimeout(500)

// GOOD - wait for actual state change
await waitForContextCount(page, initialCount + 1)
```

### 4. Direct Store Access for State Verification

```typescript
// Expose store in dev mode (like EventStormer's __tldrawEditor)
const contexts = await page.evaluate(() => {
  return window.__contextflow?.getState().project.contexts
})
```

Avoids brittle visual selectors for state verification.

### 5. Page Object Model

Create `e2e/pages/CanvasPage.ts` encapsulating all interactions:

- Setup: `clearBrowserStorage()`, `goto(projectId)`
- Canvas: `clickCanvasAt()`, `dragContext()`, `selectContext()`
- Inspector: `setContextName()`, `setClassification()`
- Views: `switchToStrategicView()`, `switchToFlowView()`

### 6. Cleanup in Page Object

```typescript
async clearBrowserStorage(): Promise<void> {
  await this.page.context().clearCookies()
  await this.page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name))
    })
  })
}
```

### 7. Smart Artifact Capture

```typescript
trace: 'on-first-retry',      // Only capture on failures
screenshot: 'only-on-failure', // Minimal storage overhead
retries: process.env.CI ? 2 : 0,
```

---

## Implementation Plan

### Phase 1: CI Foundation

1. **Create `.github/workflows/ci.yml`**
   - Lint + TypeCheck (parallel, ~30s)
   - Unit Tests (parallel, ~60-90s)
   - Build (parallel, ~60s)
   - Deploy (on main only)

2. **Fix failing test**
   - `src/model/__tests__/storeCollabIntegration.test.ts` - `canUndo` assertion

### Phase 2: Playwright Setup

1. **Install Playwright**
   ```bash
   npm install -D @playwright/test
   ```

2. **Create `playwright.config.ts`**

   ```typescript
   import { defineConfig, devices } from '@playwright/test'

   const TEST_RUN_ID = `e2e-${Date.now()}`

   export default defineConfig({
     testDir: './e2e',
     fullyParallel: false,  // Serial for Yjs sync tests
     workers: 1,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     reporter: [['html', { open: 'never' }], ['github']],
     metadata: { testRunId: TEST_RUN_ID },
     use: {
       baseURL: 'http://localhost:5173',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },
     projects: [
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     ],
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:5173',
       reuseExistingServer: !process.env.CI,
       timeout: 120000,
     },
   })
   ```

3. **Add npm scripts to `package.json`**
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui",
   "test:all": "npm run test:run && npm run test:e2e"
   ```

### Phase 3: E2E Test Infrastructure

Create test utilities following EventStormer patterns:

```
e2e/
  pages/
    CanvasPage.ts          # Page object model
  utils/
    store.ts               # Direct store access helpers
    wait.ts                # Explicit wait functions
  critical/
    sync.spec.ts           # Two-browser real-time sync
    offline.spec.ts        # Offline/reconnect flow
  workflows/
    import-export.spec.ts  # File upload/download
  canvas/
    drag-drop.spec.ts      # Canvas interactions
```

### Phase 4: Add E2E to CI

Update `.github/workflows/ci.yml`:
- Install Playwright with Chromium only
- Run E2E tests after unit tests pass
- Upload artifacts on failure (screenshots, traces)

---

## E2E Test Examples

### Two-Browser Sync (from EventStormer pattern)

```typescript
test('context created in browser A appears in browser B', async ({ browser }, testInfo) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  const canvas1 = new CanvasPage(page1, testInfo)
  const canvas2 = new CanvasPage(page2, testInfo)

  await canvas1.goto()  // Uses testRunId for isolation
  await canvas2.goto()

  await canvas1.waitForConnection()
  await canvas2.waitForConnection()

  // Create context in page1
  const initialCount = await getContextCount(page2)
  await canvas1.addContext('Test Context')

  // Wait for sync to page2
  await waitForContextCountIncrease(page2, initialCount)

  const contexts = await getContexts(page2)
  expect(contexts.some(c => c.name === 'Test Context')).toBe(true)
})
```

### Offline/Reconnect

```typescript
test('changes made offline sync after reconnection', async ({ page, context }) => {
  const canvas = new CanvasPage(page)
  await canvas.goto()
  await canvas.waitForConnection()

  // Go offline
  await context.setOffline(true)
  await canvas.waitForOfflineIndicator()

  // Make changes
  await canvas.addContext('Offline Context')

  // Go online
  await context.setOffline(false)
  await canvas.waitForConnection()

  // Verify sync (check store directly)
  const contexts = await getContexts(page)
  expect(contexts.some(c => c.name === 'Offline Context')).toBe(true)
})
```

---

## Pipeline Architecture

```
[Push to branch]
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Lint/Type   │  │ Unit Tests  │  │   Build     │
│   (~30s)    │  │  (~60-90s)  │  │   (~60s)    │
└─────────────┘  └─────────────┘  └─────────────┘
       │                 │                 │
       └────────┬────────┘                 │
                ▼                          │
       ┌─────────────┐                     │
       │ E2E Tests   │                     │
       │ (~2-3 min)  │                     │
       └─────────────┘                     │
                │                          │
                └────────────┬─────────────┘
                             ▼
                    ┌─────────────┐
                    │   Deploy    │  (main only)
                    │   (~60s)    │
                    └─────────────┘

Total: ~4-5 minutes
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `.github/workflows/ci.yml` | Create - new CI pipeline |
| `playwright.config.ts` | Create - Playwright config |
| `e2e/pages/CanvasPage.ts` | Create - Page object model |
| `e2e/utils/store.ts` | Create - Store access helpers |
| `e2e/utils/wait.ts` | Create - Explicit wait functions |
| `e2e/critical/sync.spec.ts` | Create - two-browser sync test |
| `e2e/critical/offline.spec.ts` | Create - offline/reconnect test |
| `e2e/workflows/import-export.spec.ts` | Create - import workflow test |
| `package.json` | Modify - add Playwright + scripts |
| `src/model/__tests__/storeCollabIntegration.test.ts` | Fix - failing test |

---

## Expose Store for E2E Testing

Add to `src/model/store.ts` (development only):

```typescript
if (import.meta.env.DEV) {
  (window as unknown as { __contextflow: typeof useEditorStore }).
    __contextflow = useEditorStore
}
```

This enables direct state verification in E2E tests without brittle DOM selectors.

---

## Local Development Commands

```bash
# Unit tests (fast, watch mode)
npm test              # Vitest watch mode
npm run test:run      # Single run

# E2E tests (when needed)
npm run test:e2e      # Headless
npm run test:e2e:ui   # Interactive UI mode

# All tests
npm run test:all      # Unit + E2E
```

---

## What NOT to Build

- No coverage thresholds (existing tests are comprehensive)
- No pre-commit hooks (fast CI catches issues)
- No Firefox/WebKit testing (Chromium sufficient)
- No visual regression tests (overkill for current stage)
- No parallel E2E sharding (< 10 tests, not worth complexity)
- No parallel E2E execution (serial required for Yjs sync correctness)
