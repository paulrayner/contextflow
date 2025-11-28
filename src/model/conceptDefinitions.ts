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
      'Potential source of future differentiation',
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
      'Custom-built but not a competitive advantage',
      'Consider outsourcing development if complex',
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

// Stage Definition (Flow View)
export const STAGE_DEFINITION: ConceptDefinition = {
  title: 'Stage (Value Stream Phase)',
  description:
    'A stage represents a distinct phase in your value stream.',
  characteristics: [
    'Maps to subprocess boundaries in EventStorming',
    'Groups related user needs and contexts',
    'Represents a coherent step in delivering value',
    'Often aligns with team or capability boundaries',
  ],
}

// User Definition (Value Stream / Strategic View)
export const USER_DEFINITION: ConceptDefinition = {
  title: 'User',
  description:
    'A person or system that interacts with your product to satisfy their needs.',
  characteristics: [
    'Represents a user role or external system',
    'Has specific needs your system fulfills',
    'Positioned at the top of the value chain (most visible)',
    'Multiple users may share the same underlying needs',
  ],
}

// User Need Definition
export const USER_NEED_DEFINITION: ConceptDefinition = {
  title: 'User Need',
  description:
    'A capability or outcome that a user requires from your system.',
  characteristics: [
    'Describes what the user wants to accomplish',
    'Connected to users who have this need',
    'Fulfilled by one or more bounded contexts',
    'Drives the value chain from user to implementation',
  ],
}

// Bounded Context Definition
export const BOUNDED_CONTEXT_DEFINITION: ConceptDefinition = {
  title: 'Bounded Context',
  description:
    'A boundary within which a particular domain model applies consistently.',
  characteristics: [
    'Defines clear ownership and language boundaries',
    'Contains a cohesive set of domain concepts',
    'Communicates with other contexts via defined interfaces',
    'Often maps to team boundaries or microservices',
  ],
}

// Relationship Edge Indicators
export const EDGE_INDICATORS: Record<string, ConceptDefinition> = {
  acl: {
    title: 'Anti-Corruption Layer',
    description:
      'This context translates the upstream model into its own domain language, protecting itself from upstream changes.',
    characteristics: [
      'Isolates domain model from external concepts',
      'Adds translation overhead but increases autonomy',
      'Common when integrating with legacy or third-party systems',
    ],
  },
  ohs: {
    title: 'Open-Host Service',
    description:
      'This context exposes a well-defined public API for downstream consumers to integrate with.',
    characteristics: [
      'Provides stable, versioned interface',
      'Decouples upstream implementation from downstream needs',
      'Often paired with Published Language',
    ],
  },
}

// External Context
export const EXTERNAL_CONTEXT: ConceptDefinition = {
  title: 'External Context',
  description:
    "Mark a context as external when it's outside your organization's control - third-party services, vendor systems, or legacy systems you can't modify.",
  characteristics: [
    'Cannot have repositories assigned',
    'Shown with dotted border on canvas',
    'Typically requires ACL pattern when integrating',
  ],
}

// Legacy Context
export const LEGACY_CONTEXT: ConceptDefinition = {
  title: 'Legacy Context',
  description:
    'Mark a context as legacy when it represents aging systems that may need modernization, replacement, or careful maintenance.',
  characteristics: [
    'Often accumulated technical debt',
    'May have weak or undocumented boundaries',
    'Consider strangler fig pattern for replacement',
    'Shown with amber/warning visual treatment',
  ],
}

// External User
export const EXTERNAL_USER: ConceptDefinition = {
  title: 'External User',
  description:
    'Mark a user as external when they are outside your organization - customers, partners, regulators, or third-party systems.',
  characteristics: [
    'Shown with dotted border on canvas',
    'Helps distinguish internal users from external ones',
    'External users often have different access patterns',
  ],
}

// Code Size Tiers
export const CODE_SIZE_TIERS: ConceptDefinition = {
  title: 'Code Size',
  description:
    'Estimate the relative size of this bounded context. Size affects the visual representation on the canvas.',
  characteristics: [
    'Tiny: < 1,000 lines of code',
    'Small: 1K - 10K lines',
    'Medium: 10K - 50K lines',
    'Large: 50K - 200K lines',
    'Huge: > 200K lines',
  ],
}

// Power Dynamics Legend
export const POWER_DYNAMICS: ConceptDefinition = {
  title: 'Power Dynamics',
  description:
    'Indicates which team has more control or influence over the relationship between bounded contexts.',
  characteristics: [
    '↑ Upstream controls the relationship',
    '↓ Downstream adapts to upstream',
    '↔ Mutual dependency (both teams coordinate)',
    '○ No integration (Separate Ways)',
  ],
}

// View Descriptions
export const VIEW_DESCRIPTIONS: Record<string, ConceptDefinition> = {
  flow: {
    title: 'Value Stream View',
    description: 'Map bounded contexts within your value stream stages to visualize how capabilities support value delivery.',
    characteristics: [
      'Organize contexts by value stream stages',
      'See which contexts support each phase',
      'Visualizes the value chain',
      'Identify handoffs and dependencies',
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

// Value Chain Visibility (Y-axis labels in Value Stream and Strategic views)
export const VALUE_CHAIN_VISIBILITY: Record<string, ConceptDefinition> = {
  visible: {
    title: 'Visible',
    description: 'Components that users directly interact with or are aware of. Users and their needs at the top represent the problem space—the anchor from which the entire map flows.',
    characteristics: [
      'User-facing functionality',
      'Directly creates perceived value',
      'Changes here are noticed by users',
      'Often the focus of UX investment',
    ],
  },
  invisible: {
    title: 'Invisible',
    description: 'Components that support visible features but users never see directly.',
    characteristics: [
      'Infrastructure and plumbing',
      'Enables visible capabilities',
      'Technical debt often accumulates here',
      'Commoditize where possible',
    ],
  },
}

// Distillation Axes (Nick Tune's Core Domain Chart)
export const DISTILLATION_AXES: Record<string, ConceptDefinition> = {
  businessDifferentiation: {
    title: 'Business Differentiation',
    description: 'How much this capability sets you apart from competitors.',
    characteristics: [
      'Low: Common to all businesses in your industry',
      'High: Unique to your competitive advantage',
      'Core domains should be high differentiation',
      'Generic domains are low differentiation',
    ],
  },
  modelComplexity: {
    title: 'Model Complexity',
    description: 'How intricate and sophisticated the domain model needs to be.',
    characteristics: [
      'Low: Simple CRUD operations, few business rules',
      'High: Complex algorithms, many edge cases',
      'Core domains often have high complexity',
      'Consider simplifying or buying low-complexity domains',
    ],
  },
}

// Distillation Regions (extends STRATEGIC_CLASSIFICATIONS with canvas-specific guidance)
export const DISTILLATION_REGIONS: Record<string, ConceptDefinition> = {
  core: {
    title: 'Core Domain',
    description: 'High differentiation, high complexity. This is your competitive advantage.',
    characteristics: [
      'Invest your best talent here',
      'Build and maintain in-house',
      'Worth significant investment',
      'Source of competitive advantage (i.e. economic moat)',
    ],
  },
  supporting: {
    title: 'Supporting Subdomain',
    description: 'Low differentiation but necessary. Custom-built to support core functionality.',
    characteristics: [
      'Necessary for core to function',
      'Custom-built but not a competitive advantage',
      'Consider outsourcing development if complex',
      'Keep simple where possible',
    ],
  },
  generic: {
    title: 'Generic Subdomain',
    description: 'Low differentiation. Common capabilities that many businesses need.',
    characteristics: [
      'Not unique to your business',
      'Buy, rent, or use open source',
      'Minimize custom development',
      'Commoditize aggressively',
    ],
  },
}

// Temporal Mode
export const TEMPORAL_MODE: ConceptDefinition = {
  title: 'Temporal Mode',
  description:
    'Track how your architecture evolves over time using keyframes - snapshots of context positions at specific dates.',
  characteristics: [
    'Create keyframes to capture architecture at points in time',
    'Visualize planned migrations and transformations',
    'Animate between keyframes to see evolution',
    'Useful for roadmap planning and stakeholder communication',
  ],
}

// Keyframe
export const KEYFRAME_DEFINITION: ConceptDefinition = {
  title: 'Keyframe',
  description:
    'A snapshot of your architecture at a specific point in time, capturing where contexts are positioned.',
  characteristics: [
    'Use YYYY or YYYY-Q2 format for dates',
    'Drag contexts to set their positions for each keyframe',
    'The timeline interpolates between keyframes',
    'Hide or show contexts at different time periods',
  ],
}

// Communication Mode
export const COMMUNICATION_MODE: ConceptDefinition = {
  title: 'Communication Mode',
  description:
    'How two bounded contexts technically communicate with each other.',
  characteristics: [
    'REST API - synchronous HTTP calls',
    'gRPC - high-performance RPC framework',
    'Event Bus - asynchronous messaging',
    'Shared Database - direct data access (often a smell)',
  ],
}
