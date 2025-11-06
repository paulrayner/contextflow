# Coordinate Systems in ContextFlow

## React Flow Node Positioning

**CRITICAL UNDERSTANDING**: React Flow positions ALL nodes using a **translate** transform that corresponds DIRECTLY to the node's position value.

### How React Flow Positions Nodes

```typescript
// Given a node with position: { x: 700, y: 550 }
// React Flow applies: transform: translate(700px, 550px)

// This means:
// - The node's TOP-LEFT corner is at (700, 550) in canvas space
// - NOT the center - the TOP-LEFT corner
```

### Real Example from DOM Inspection

From Playwright inspection of actual nodes:

```javascript
// Inventory Management context
{
  position: { x: 700, y: 550 },
  width: 200,
  height: 120,
  transform: "translate(700px, 550px)"  // TOP-LEFT at (700, 550)
}

// Therefore edges are:
// Left: 700
// Right: 700 + 200 = 900
// Top: 550
// Bottom: 550 + 120 = 670
```

### Common Mistake

**WRONG ASSUMPTION**: "React Flow uses center positioning"
- This led to calculating: position.x - width/2 for left edge
- This is INCORRECT

**CORRECT UNDERSTANDING**: React Flow uses top-left positioning
- Left edge = position.x
- Right edge = position.x + width
- Top edge = position.y
- Bottom edge = position.y + height

## Bounding Box Calculation

Given contexts positioned by their top-left corners:

```typescript
// THREE CONTEXTS (Real data from ACME E-Commerce):
const contexts = [
  // Inventory Management
  { x: 700, y: 550, width: 200, height: 120 },
  // Warehouse Management System
  { x: 1400, y: 400, width: 240, height: 140 },
  // Shipping Integration
  { x: 1500, y: 600, width: 170, height: 100 }
]

// BOUNDING BOX CALCULATION:
// minX = min(700, 1400, 1500) = 700
// maxX = max(700+200, 1400+240, 1500+170) = max(900, 1640, 1670) = 1670
// minY = min(550, 400, 600) = 400
// maxY = max(550+120, 400+140, 600+100) = max(670, 540, 700) = 700

// Expected bounding box:
{
  minX: 700,
  maxX: 1670,
  minY: 400,
  maxY: 700
}

// Bounding box dimensions: 970 × 300
```

## Previous Wrong Calculations

### What I Was Doing Wrong

I was treating position values as CENTER points:

```typescript
// WRONG - assumed center positioning
const minX = Math.min(...contexts.map(c => c.x - c.width / 2))
// For Inventory: 700 - 200/2 = 600 (WRONG!)
```

### What I Should Have Been Doing

```typescript
// CORRECT - position is top-left
const minX = Math.min(...contexts.map(c => c.x))
// For Inventory: 700 (CORRECT!)
```

## Blob Positioning

The blob must be positioned so its container encompasses all contexts:

```typescript
// Blob bounds in relative space (from Catmull-Rom curve generation)
// Example: { minX: -180, maxX: 1150, minY: -180, maxY: 480 }

// Blob container dimensions
const containerWidth = blobBounds.maxX - blobBounds.minX
const containerHeight = blobBounds.maxY - blobBounds.minY

// Blob container position (top-left corner in canvas space)
const containerX = boundingBox.minX + blobBounds.minX
const containerY = boundingBox.minY + blobBounds.minY

// React Flow node position (same as top-left since RF uses top-left)
position: { x: containerX, y: containerY }
```

## Summary: The One Rule

**React Flow position = top-left corner of the node in canvas space**

Not center. Not some other point. Always top-left.
