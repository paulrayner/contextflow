# Performance Baseline

This document captures baseline performance metrics for ContextFlow to help identify regressions as the application grows.

## Bundle Size

**Measured:** 2025-12-02

### Production Build

```text
dist/assets/index-BH7vKgC-.js
  Raw: 733.40 KB
  Gzipped: 196.11 KB
```

### Measurement Steps

```bash
npm run perf
# Or manually:
# npm run build
# Check output for dist/assets/index-*.js size
```

## Load Performance

**Measured:** TBD - measure manually

### Empty Project Load Time

Time from navigation to interactive canvas with sample project loaded.

**Metric:** TBD ms

### Measurement Steps (Load Time)

1. Build production version: `npm run build`
2. Serve production build: `npm run preview`
3. Open browser DevTools (Performance tab)
4. Start recording
5. Navigate to application URL
6. Wait until canvas is interactive (all contexts rendered)
7. Stop recording
8. Note total time from navigationStart to load complete

**Key Events:**

- `navigationStart` → `responseEnd`: Network time
- `responseEnd` → `domContentLoadedEventEnd`: Parse/execute JS
- `domContentLoadedEventEnd` → canvas interactive: React render + React Flow initialization

## Memory Usage

**Measured:** TBD - measure manually

### Baseline Heap Size

Memory usage after initial render with sample project (empty state).

**Metric:** TBD MB

### Measurement Steps (Memory)

1. Open application in Chrome
2. Open DevTools → Memory tab
3. Click "Take heap snapshot"
4. Note "Shallow Size" total at bottom of snapshot view

### With Sample Project

Memory usage with `examples/sample.project.json` loaded (13 contexts, 8 relationships, 2 groups).

**Metric:** TBD MB

## Measurement Guidelines

### When to Re-measure

- Before each minor version release (0.x.0)
- After adding major features (Timeline, Strategic View, etc.)
- If performance degradation is suspected

### Acceptable Ranges

These are targets, not hard limits:

- **Bundle size (gzipped):** < 250 KB
  - Current dependencies (React Flow, Framer Motion, etc.) already account for ~200 KB
  - Watch for growth > 50 KB between measurements
- **Empty project load:** < 1000 ms
  - On modern hardware (MacBook Pro 2020+)
  - Measured in production build
- **Memory baseline:** < 50 MB heap
  - After initial render
  - Before loading any project data

### Notes

- All measurements should use production builds (`npm run build` + `npm run preview`)
- Load time measurements should be done in Chrome with no extensions
- Take multiple samples and report median value
- Document hardware specs when measuring (CPU, RAM, browser version)

## Future Enhancements

When automated performance testing becomes necessary:

- Use Playwright + Lighthouse for automated load time measurement
- Add bundle size tracking in CI pipeline
- Set up performance budgets with alerts on regression
