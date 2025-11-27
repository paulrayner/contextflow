/**
 * Educational content for DDD and Wardley Mapping concepts.
 * Used by InfoTooltip components throughout the app.
 */

export interface ConceptDefinition {
  title: string
  description: string
  characteristics?: string[]
}

// Evolution Stages (Wardley Mapping)
export const EVOLUTION_STAGES: Record<string, ConceptDefinition> = {
  genesis: {
    title: 'Genesis',
    description: 'Novel and poorly understood. Requires experimentation and exploration.',
    characteristics: [
      'Chaotic and uncertain',
      'Requires constant experimentation',
      'High failure rate is acceptable',
      'Source of competitive differentiation',
    ],
  },
  'custom-built': {
    title: 'Custom-Built',
    description: 'Understood enough to build, but requires tailored implementation.',
    characteristics: [
      'Emerging understanding',
      'Best practices forming',
      'Custom solutions still needed',
      'Growing body of knowledge',
    ],
  },
  'product/rental': {
    title: 'Product',
    description: 'Well-understood and available as products or services from vendors.',
    characteristics: [
      'Multiple vendors available',
      'Feature differentiation',
      'Increasingly standardized',
      'Focus shifts to features',
    ],
  },
  'commodity/utility': {
    title: 'Commodity',
    description: 'Highly standardized, often provided as a utility service.',
    characteristics: [
      'Standardized and interchangeable',
      'Focus on operational efficiency',
      'Cost is primary differentiator',
      'Often outsourced or cloud-based',
    ],
  },
}

// Strategic Classifications (DDD Core Domain Chart)
export const STRATEGIC_CLASSIFICATIONS: Record<string, ConceptDefinition> = {
  core: {
    title: 'Core Domain',
    description: 'What makes your business unique. This is where you should invest most heavily.',
    characteristics: [
      'Source of competitive advantage',
      'Build and maintain in-house',
      'Attract your best talent here',
      'Worth significant investment',
    ],
  },
  supporting: {
    title: 'Supporting Subdomain',
    description: 'Necessary for the business but not a differentiator.',
    characteristics: [
      'Supports core domain functionality',
      'Could be custom or off-the-shelf',
      'Consider outsourcing if complex',
      'Keep simple where possible',
    ],
  },
  generic: {
    title: 'Generic Subdomain',
    description: 'Common capabilities that many businesses need. Buy or use open source.',
    characteristics: [
      'Not unique to your business',
      'Well-solved problems exist',
      'Buy, rent, or use open source',
      'Minimize custom development',
    ],
  },
}

// Boundary Integrity Levels
export const BOUNDARY_INTEGRITY: Record<string, ConceptDefinition> = {
  strong: {
    title: 'Strong Boundary',
    description: 'Well-defined interface with strict contracts. Changes are controlled and versioned.',
    characteristics: [
      'Clear API contracts',
      'Versioned interfaces',
      'Independent deployability',
      'Minimal coupling',
    ],
  },
  moderate: {
    title: 'Moderate Boundary',
    description: 'Defined interface but some coupling exists. Coordination needed for changes.',
    characteristics: [
      'Some shared dependencies',
      'Coordination required for changes',
      'Working toward stronger boundary',
      'Acceptable for supporting domains',
    ],
  },
  weak: {
    title: 'Weak Boundary',
    description: 'Significant coupling with other contexts. High coordination cost for changes.',
    characteristics: [
      'Shared database or models',
      'Tight coupling',
      'Changes ripple across contexts',
      'Consider strengthening over time',
    ],
  },
}

// View Descriptions
export const VIEW_DESCRIPTIONS: Record<string, ConceptDefinition> = {
  flow: {
    title: 'Value Stream View',
    description: 'Map how value flows from users through your system. Based on User Needs Mapping.',
    characteristics: [
      'Shows Actor → Need → Context flow',
      'Visualizes the value chain',
      'Identifies user-facing vs invisible work',
      'Based on userneedsmapping.com methodology',
    ],
  },
  distillation: {
    title: 'Distillation View',
    description: 'Identify strategic importance using DDD Core Domain Chart.',
    characteristics: [
      'Classify as Core, Supporting, or Generic',
      'Guide investment decisions',
      'Based on DDD strategic design',
      'Helps prioritize where to focus effort',
    ],
  },
  strategic: {
    title: 'Strategic View',
    description: 'Wardley Map style positioning showing evolution and value chain.',
    characteristics: [
      'X-axis: Evolution (Genesis → Commodity)',
      'Y-axis: Value chain (Visible → Invisible)',
      'Track how contexts evolve over time',
      'Based on Wardley Mapping methodology',
    ],
  },
}
