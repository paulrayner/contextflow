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
   - Chromium only (faster CI)
   - Parallel execution
   - Dev server auto-start
   - Screenshots on failure only

3. **Add npm scripts to `package.json`**
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui",
   "test:all": "npm run test:run && npm run test:e2e"
   ```

### Phase 3: Critical E2E Tests

Create `e2e/` directory with minimal high-value tests:

```
e2e/
  critical/
    sync.spec.ts           # Two-browser real-time sync
    offline.spec.ts        # Offline/reconnect flow
  workflows/
    import-export.spec.ts  # File upload/download
  canvas/
    drag-drop.spec.ts      # Canvas interactions
```

**E2E Test Design Principles:**
- Use `data-testid` attributes (add as needed)
- No artificial waits - use `waitForSelector`
- Fresh project IDs per test (no cleanup needed)
- Parallel browser contexts for sync tests

### Phase 4: Add E2E to CI

Update `.github/workflows/ci.yml`:
- Install Playwright with Chromium only
- Run E2E tests after unit tests pass
- Upload artifacts on failure (screenshots, traces)

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
| `e2e/critical/sync.spec.ts` | Create - two-browser sync test |
| `e2e/critical/offline.spec.ts` | Create - offline/reconnect test |
| `e2e/workflows/import-export.spec.ts` | Create - import workflow test |
| `package.json` | Modify - add Playwright + scripts |
| `src/model/__tests__/storeCollabIntegration.test.ts` | Fix - failing test |

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
