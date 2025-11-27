import type { Relationship } from './types'

export type PowerDynamics = 'upstream' | 'downstream' | 'mutual' | 'none'
export type PatternCategory = 'upstream-downstream' | 'mutual' | 'autonomous'

export interface PatternDefinition {
  value: Relationship['pattern']
  label: string
  powerDynamics: PowerDynamics
  category: PatternCategory
  shortDescription: string
  detailedDescription: string
  whenToUse: string[]
  example: string
}

/**
 * Power dynamics icons for visual indication in dropdowns
 */
export const POWER_DYNAMICS_ICONS: Record<PowerDynamics, string> = {
  upstream: '↑',    // Upstream has control
  downstream: '↓',  // Downstream has control (defensive)
  mutual: '↔',      // Shared control
  none: '○',        // No integration
}

/**
 * Comprehensive DDD relationship pattern definitions.
 * Single source of truth for all pattern metadata.
 */
export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    value: 'customer-supplier',
    label: 'Customer-Supplier',
    powerDynamics: 'upstream',
    category: 'upstream-downstream',
    shortDescription: 'Upstream delivers what downstream needs',
    detailedDescription:
      'The upstream team (supplier) provides data or services that the downstream team (customer) depends on. The upstream team should consider downstream needs when planning, but ultimately controls the delivery schedule and model.',
    whenToUse: [
      'Clear dependency where one team provides data/services to another',
      'Upstream team is willing to accommodate downstream requests',
      'Downstream has some negotiating power over priorities',
    ],
    example:
      'An Order Management context depends on Product Catalog for product information. Product Catalog prioritizes Order Management\'s needs but owns the product model.',
  },
  {
    value: 'conformist',
    label: 'Conformist',
    powerDynamics: 'upstream',
    category: 'upstream-downstream',
    shortDescription: 'Downstream adopts upstream model as-is',
    detailedDescription:
      'The downstream team fully adopts the upstream model without translation. This is appropriate when the upstream model is good enough and the cost of translation outweighs the benefits. The downstream team has no influence over the upstream model.',
    whenToUse: [
      'Upstream model is well-designed and fits downstream needs',
      'Upstream team has no capacity to accommodate downstream',
      'Cost of maintaining a translation layer is too high',
      'Integrating with a dominant external system or standard',
    ],
    example:
      'A reporting context conforms to an ERP system\'s data model rather than maintaining its own translation, accepting the ERP\'s terminology and structure.',
  },
  {
    value: 'anti-corruption-layer',
    label: 'Anti-Corruption Layer',
    powerDynamics: 'downstream',
    category: 'upstream-downstream',
    shortDescription: 'Downstream protects itself with translation layer',
    detailedDescription:
      'The downstream team creates a translation layer to isolate their model from the upstream model. This prevents upstream concepts from "corrupting" the downstream domain model. The ACL translates between the two models.',
    whenToUse: [
      'Upstream model is legacy, poorly designed, or doesn\'t fit your domain',
      'You need to protect your model\'s integrity',
      'Integrating with external systems you don\'t control',
      'The upstream model changes frequently',
    ],
    example:
      'A modern Order context integrates with a legacy inventory system through an ACL that translates between the legacy data structures and the clean domain model.',
  },
  {
    value: 'open-host-service',
    label: 'Open Host Service',
    powerDynamics: 'upstream',
    category: 'upstream-downstream',
    shortDescription: 'Upstream provides well-defined public API',
    detailedDescription:
      'The upstream team provides a well-documented, stable API (the "open host") for multiple downstream consumers. The protocol is designed for general use rather than any specific consumer. Often paired with Published Language.',
    whenToUse: [
      'Multiple downstream contexts need the same data/services',
      'You want to decouple from individual consumer needs',
      'Building a platform or shared service',
      'Public or partner-facing APIs',
    ],
    example:
      'A Customer context exposes a REST API that multiple contexts (Orders, Shipping, Marketing) consume to access customer data.',
  },
  {
    value: 'published-language',
    label: 'Published Language',
    powerDynamics: 'upstream',
    category: 'upstream-downstream',
    shortDescription: 'Shared, well-documented interchange format',
    detailedDescription:
      'A well-documented, shared language (data format, protocol, or schema) used for integration between contexts. Often used alongside Open Host Service. The language is versioned and maintained independently.',
    whenToUse: [
      'Need a standard interchange format between multiple contexts',
      'Industry standards exist (e.g., SWIFT for banking, HL7 for healthcare)',
      'Building event-driven systems with shared event schemas',
      'API contracts that need formal documentation',
    ],
    example:
      'Multiple contexts exchange order events using a shared OrderEvent schema defined in a schema registry, with versioning and backward compatibility guarantees.',
  },
  {
    value: 'shared-kernel',
    label: 'Shared Kernel',
    powerDynamics: 'mutual',
    category: 'mutual',
    shortDescription: 'Teams share a subset of the model',
    detailedDescription:
      'Two or more teams share a common subset of the domain model (code, database schema, or both). Changes to the shared kernel require coordination between all teams. This creates tight coupling but reduces duplication.',
    whenToUse: [
      'Core domain concepts are truly shared between contexts',
      'Teams can commit to coordinated changes',
      'Duplication would be more costly than coordination',
      'Teams are closely aligned (same department, similar schedules)',
    ],
    example:
      'Order and Fulfillment contexts share a common Address value object and validation rules, maintained in a shared library with joint ownership.',
  },
  {
    value: 'partnership',
    label: 'Partnership',
    powerDynamics: 'mutual',
    category: 'mutual',
    shortDescription: 'Teams succeed or fail together',
    detailedDescription:
      'Two contexts have a mutual dependency where both teams must coordinate closely. Neither team is upstream or downstream—they depend on each other and must plan together. Failure in either context affects both.',
    whenToUse: [
      'Mutual dependencies that can\'t be untangled',
      'Teams are willing to coordinate release schedules',
      'Features span both contexts and must ship together',
      'High trust and communication between teams',
    ],
    example:
      'Checkout and Payment contexts are in partnership—new payment methods require coordinated changes in both contexts, and they release together.',
  },
  {
    value: 'separate-ways',
    label: 'Separate Ways',
    powerDynamics: 'none',
    category: 'autonomous',
    shortDescription: 'No integration between contexts',
    detailedDescription:
      'A deliberate decision not to integrate two contexts. Each context solves its own problems independently, even if this means some duplication. This eliminates integration complexity and allows full autonomy.',
    whenToUse: [
      'Integration cost exceeds the benefit',
      'Contexts have very different lifecycles or priorities',
      'Duplication is acceptable for the use case',
      'Teams need maximum autonomy',
    ],
    example:
      'Marketing and Warehouse contexts both maintain their own product descriptions rather than integrating, because their needs are different enough that integration adds more complexity than value.',
  },
]

/**
 * Get pattern definition by value
 */
export function getPatternDefinition(pattern: Relationship['pattern']): PatternDefinition | undefined {
  return PATTERN_DEFINITIONS.find(p => p.value === pattern)
}

/**
 * Get patterns grouped by category
 */
export function getPatternsByCategory(): Record<PatternCategory, PatternDefinition[]> {
  return {
    'upstream-downstream': PATTERN_DEFINITIONS.filter(p => p.category === 'upstream-downstream'),
    'mutual': PATTERN_DEFINITIONS.filter(p => p.category === 'mutual'),
    'autonomous': PATTERN_DEFINITIONS.filter(p => p.category === 'autonomous'),
  }
}

/**
 * Simple pattern list for dropdowns (backward compatible with old DDD_PATTERNS)
 */
export const DDD_PATTERNS = PATTERN_DEFINITIONS.map(p => ({
  value: p.value,
  label: p.label,
  description: p.shortDescription,
}))
