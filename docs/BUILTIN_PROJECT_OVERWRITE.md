# Bug: Built-in Projects Overwrite User Changes on App Update

## Problem

When a new version of ContextFlow is deployed to GitHub Pages, any user edits to built-in projects (e.g., `sample.project.json`, `cbioportal.project.json`) are overwritten with the new version from the codebase.

## Root Cause

In [src/model/store.ts:258-262](../src/model/store.ts#L258-L262), all built-in projects are **unconditionally saved** to IndexedDB on every app load:

```typescript
// Save all projects to IndexedDB asynchronously
BUILT_IN_PROJECTS.forEach(project => {
  saveProject(project).catch((err) => {
    console.error(`Failed to save ${project.name}:`, err)
  })
})
```

This happens **before** the app attempts to load existing saved versions from IndexedDB (lines 2745-2760).

## Impact

**User scenario:**
1. User opens `sample.project.json` and makes edits (adds contexts, changes names, repositions nodes)
2. User closes browser → changes are saved to IndexedDB ✓
3. Developer pushes new version with updated `sample.project.json`
4. User visits site → **new version overwrites their changes** ❌

## Proposed Solution

Change the logic to save built-in projects **only if they don't already exist** in IndexedDB:

```typescript
// Save built-in projects to IndexedDB ONLY if not already saved
BUILT_IN_PROJECTS.forEach(async project => {
  const existing = await loadProject(project.id)
  if (!existing) {
    saveProject(project).catch((err) => {
      console.error(`Failed to save ${project.name}:`, err)
    })
  }
})
```

## Alternative Considerations

### Option 1: Don't persist built-in projects at all
- Keep them as read-only templates
- Force users to explicitly "Save As" to create an editable copy
- **Pro**: No data loss possible
- **Con**: Breaking change, worse UX

### Option 2: Version tracking for built-in projects
- Add version field to built-in projects
- Only overwrite if new version is available
- Show user a migration prompt
- **Pro**: Allows updates to reach users
- **Con**: More complex implementation

### Option 3: Recommended approach (simplest fix)
- Only save built-in projects on first load (proposed solution above)
- **Pro**: Fixes data loss, minimal code change
- **Con**: Users won't get updates to built-in projects

## Implementation Steps

1. **Test**: Write test in `store.test.ts` to verify built-in projects aren't overwritten
2. **Fix**: Update initialization logic in `store.ts` (lines 258-262)
3. **Verify**: Manual test in browser with DevTools IndexedDB inspection
4. **Document**: Add note to CHANGELOG.md about bug fix

## Priority

**High** - This is a data loss bug that affects any user who edits built-in projects.
