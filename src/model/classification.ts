// Classification logic based on distillation position
export function classifyFromDistillationPosition(x: number, y: number): 'core' | 'supporting' | 'generic' {
  // x = Business Differentiation (0-100, horizontal)
  // y = Model Complexity (0-100, vertical)

  if (x < 33) {
    // Low differentiation (left column)
    return 'generic'
  } else if (x >= 67 && y >= 50) {
    // High differentiation, high complexity (top-right)
    return 'core'
  } else {
    // Everything else (middle + bottom-right)
    return 'supporting'
  }
}

// Evolution classification based on strategic position (Wardley evolution axis)
export function classifyFromStrategicPosition(x: number): 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility' {
  // x = Evolution (0-100, horizontal on Strategic View)
  // Divide into 4 equal zones matching Wardley evolution stages

  if (x < 25) {
    return 'genesis'
  } else if (x < 50) {
    return 'custom-built'
  } else if (x < 75) {
    return 'product/rental'
  } else {
    return 'commodity/utility'
  }
}
