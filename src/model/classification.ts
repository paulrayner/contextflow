export const DISTILLATION_GENERIC_MAX_X = 33
export const DISTILLATION_CORE_MIN_X = 67
export const DISTILLATION_CORE_MIN_Y = 50

export const STRATEGIC_GENESIS_MAX_X = 25
export const STRATEGIC_CUSTOM_BUILT_MAX_X = 50
export const STRATEGIC_PRODUCT_RENTAL_MAX_X = 75

export function classifyFromDistillationPosition(x: number, y: number): 'core' | 'supporting' | 'generic' {
  // x = Business Differentiation (0-100, horizontal)
  // y = Model Complexity (0-100, vertical)

  if (x < DISTILLATION_GENERIC_MAX_X) {
    return 'generic'
  } else if (x >= DISTILLATION_CORE_MIN_X && y >= DISTILLATION_CORE_MIN_Y) {
    return 'core'
  } else {
    return 'supporting'
  }
}

export function classifyFromStrategicPosition(x: number): 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility' {
  // x = Evolution (0-100, horizontal on Strategic View)

  if (x < STRATEGIC_GENESIS_MAX_X) {
    return 'genesis'
  } else if (x < STRATEGIC_CUSTOM_BUILT_MAX_X) {
    return 'custom-built'
  } else if (x < STRATEGIC_PRODUCT_RENTAL_MAX_X) {
    return 'product/rental'
  } else {
    return 'commodity/utility'
  }
}
