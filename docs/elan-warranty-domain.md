# Elan Extended Warranty Domain Analysis

## Case Study Summary

Elan Extended Warranty Company provides extended warranty coverage for consumer products after manufacturer warranties expire. The business operates through two customer acquisition channels:

1. **Lead Management**: Direct marketing to customers approaching manufacturer warranty expiration
2. **Point of Sale**: Extended warranties sold at retail partners at time of product purchase

When covered products fail, customers contact the call center to open claims. The company coordinates repairs through third-party service networks or provides cash reimbursement when repair costs exceed the contract's limit of liability.

## Business Context

The case study follows David and Claudia's dishwasher warranty journey:
- Purchased extended warranty after 3-year manufacturer warranty expired
- Experienced multiple repair attempts over 3 months
- Eventually received store credit reimbursement when repair costs approached product value
- Contract fulfilled and terminated

## Bounded Contexts

### Internal Contexts (7)

#### 1. Lead Management
- **Classification**: Supporting
- **Purpose**: Track potential customers approaching manufacturer warranty expiration and execute marketing campaigns
- **Boundary Integrity**: Strong
- **Key Responsibilities**:
  - Maintain contact records in Leads database
  - Track manufacturer warranty expiration dates
  - Send pre-expiration marketing mailings
  - Convert leads to customers
- **Notes**: Completely separate pipeline from POS-originated warranties. Different department and business process.

#### 2. Contract Administration
- **Classification**: Core
- **Purpose**: Manage extended warranty contract lifecycle from creation through termination
- **Boundary Integrity**: Strong (heavily protected by multiple ACLs)
- **Key Responsibilities**:
  - Create and validate warranty contracts
  - Manage contract effective/expiration dates
  - Track covered products (translated from Product Management)
  - Contains Client Transaction Processing module (POS integration ACLs)
  - Maintain customer information
- **Domain Model**: Contract aggregate, Customer entity, Covered Product value object
- **Notes**: Core domain with complex validation rules. Protected by ACLs from both Product Management BBOM and multiple retail POS systems.

#### 3. Product Management (BBOM)
- **Classification**: Generic + Legacy
- **Purpose**: Manage catalog of products eligible for warranty coverage (brands, makes, models)
- **Boundary Integrity**: Weak (big ball of mud)
- **Key Responsibilities**:
  - Define product catalog with full technical specifications
  - Determine coverage eligibility
  - Provide product master data
- **Notes**: Legacy system with tangled dependencies. BBOM = Big Ball of Mud. No clear API contracts. Product entity is complex and overly detailed for downstream needs.

#### 4. Claims Management
- **Classification**: Core
- **Purpose**: Handle warranty claim lifecycle and determine fulfillment approach
- **Boundary Integrity**: Moderate to Strong
- **Key Responsibilities**:
  - Open/close/reopen claims
  - Track repair attempts and costs
  - Calculate limit of liability (repair costs vs contract value)
  - Authorize reimbursements
  - Publish Open Host Service API for external CRM integration
- **Customer Facing**: Yes (only customer-facing context, via CSR role)
- **Domain Model**: Claim aggregate with complex state machine
- **Notes**: This is where business risk and complexity lives. Complex state transitions (open → closed → reopened). Tight collaboration with Service Dispatch via shared kernel.

#### 5. Service Dispatch
- **Classification**: Supporting
- **Purpose**: Coordinate repair work orders and technician assignments
- **Boundary Integrity**: Moderate
- **Key Responsibilities**:
  - Create and manage repair purchase orders (POs)
  - Send POs to Servicer Management System (3rd party)
  - Track repair costs and parts
  - Coordinate technician assignments and expertise matching
- **Notes**: Orchestrates repair fulfillment. Shares domain concepts with Claims Management (shared kernel). Protects itself from Servicer System API changes via ACL.

#### 6. Finance & Reimbursement
- **Classification**: Generic
- **Purpose**: Process payments and reimbursements
- **Boundary Integrity**: Strong
- **Key Responsibilities**:
  - Issue store credits for market replacement value
  - Process reimbursement authorizations from Claims
  - Track costs vs contract value
- **Notes**: Standard accounting operations. No competitive differentiation. Generic financial processing.

#### 7. Reporting
- **Classification**: Supporting
- **Purpose**: Provide business intelligence and analytics for internal users
- **Boundary Integrity**: Weak (conformist with upstream domains)
- **Key Responsibilities**:
  - Generate dashboards for managers and analysts
  - Provide operational reports for CSRs
  - Analytics on claim patterns, repair costs, contract performance
- **User Facing**: Yes (internal users - managers, analysts, CSRs)
- **Notes**: Conformist pattern with all upstream domains (Contract Admin, Claims, Service Dispatch). Accepts their domain models without translation. Read-only analytics context.

### External Contexts (3)

#### 8. Retail POS Systems
- **Type**: External (multiple 3rd party integrations)
- **Purpose**: Point of sale systems at retail partners where customers purchase extended warranties
- **Integration Pattern**: Anti-corruption-layer (one ACL per retailer)
- **Key Data**: Customer details, covered product details, warranty terms, purchase date
- **Notes**: Each retail partner sends proprietary format. Contract Administration's Client Transaction Processing module contains multiple ACLs to translate and validate inbound transactions.

#### 9. CRM System
- **Type**: External (3rd party)
- **Purpose**: Track customer contact history and interactions
- **Integration Pattern**: Open Host Service (Claims Management publishes API)
- **Key Data**: Customer information, product information, claim status
- **Notes**: Used by CSRs. Claims Management is upstream authority defining the API contract. CRM consumes this published integration API.

#### 10. Servicer Management System
- **Type**: External (3rd party)
- **Purpose**: Dispatch repair technicians and coordinate field service
- **Integration Pattern**: Anti-corruption-layer (Service Dispatch protects itself)
- **Key Data**: Repair POs, technician assignments, parts/labor costs
- **Notes**: Has public API that we integrate with. Service Dispatch uses ACL to protect core domain from external API changes.

## Relationships and DDD Patterns

### Anti-Corruption Layer (ACL)

**Product Management → Contract Administration**
- Product entity (complex, detailed) → Covered Product value object (Brand-Make-Model-SKU only)
- ACL forms part of Contract Administration boundary
- Protects core domain from BBOM complexity and legacy structure

**Retail POS → Contract Administration**
- Multiple ACLs (one per retail partner)
- Each retailer sends proprietary transaction format
- Client Transaction Processing module validates and translates to Contract domain model
- Protects Contract Administration from external format volatility

**Lead Management → Contract Administration**
- Lead data → Customer + Contract entities
- ACL translates lead prospect data into contract domain model
- Different data structures and business rules for lead conversion

**Claims Management → Finance**
- Claims protects itself from Finance changes
- Translates reimbursement authorization into Finance-specific payment format
- Isolates core Claims domain from generic accounting system

**Service Dispatch → Servicer Management System**
- Protects internal repair coordination domain from 3rd party API changes
- Translates internal repair PO model to external servicer API format
- Critical isolation layer for external dependency

### Partnership

**Contract Administration ↔ Claims Management**
- Tight collaboration between core contexts
- High coordination on domain model changes
- Claims validate against contract terms, effective dates, coverage rules
- Shared responsibility for contract fulfillment lifecycle

### Shared Kernel

**Claims Management ↔ Service Dispatch**
- Shared domain concepts (likely: Claim entity, Repair cost tracking, Limit of liability calculation)
- High coordination cost - teams must synchronize on shared model changes
- Close collaboration needed for repair orchestration and cost tracking
- Why not separate? Complex business logic requires shared understanding of repair attempts, costs, and claim state

### Open Host Service (OHS)

**Claims Management → CRM System**
- Claims Management publishes well-defined integration API
- CRM consumes customer and product information
- Claims is upstream authority defining the API contract
- Published language for external system integration

### Conformist

**Contract Administration → Reporting**
**Claims Management → Reporting**
**Service Dispatch → Reporting**
- Reporting accepts upstream domain models without translation
- No ACL protection - conforms to source data structures
- Lower development cost but higher coupling
- Makes sense for read-only analytics context consuming from multiple sources

### Customer-Supplier

*Note: Originally considered for some relationships, but analysis revealed that ACL, partnership, and shared kernel patterns better represent the actual integration dynamics in this domain.*

## Value Stream Analysis

### Stages

1. **Acquisition** - Customer acquisition through leads or POS
2. **Contract Admin** - Contract creation and validation
3. **Claims Benefit Management** - Claim processing and decision-making
4. **Fulfillment** - Repair execution or reimbursement
5. **Analysis** - Reporting and business intelligence

### Data Flow (Left to Right)

**Acquisition Stage (data ingestion):**
- Lead Management (ingests lead data from marketing campaigns)
- Retail POS Systems (external - ingests POS transaction data)
- Product Management BBOM (provides product catalog data)

**Contract Admin Stage:**
- Contract Administration (receives from Lead Mgmt + POS, creates validated contracts)

**Claims Benefit Management Stage:**
- Claims Management (receives claim requests from customers via CSRs, processes claims)

**Fulfillment Stage:**
- Service Dispatch (coordinates repair work)
- Servicer Management System (external - executes repairs)
- Finance & Reimbursement (executes cash reimbursements)
- CRM System (external - tracks customer interactions)

**Analysis Stage (data output):**
- Reporting (outputs business intelligence, dashboards, analytics)

### Value Chain Positioning (Y-axis: User-Facing to Enabling)

**Top Tier (User-Facing):**
- Claims Management (external customers via CSR interactions)
- Reporting (internal users - managers, analysts, CSRs viewing dashboards)

**Middle Tier (Core Business Logic):**
- Lead Management
- Contract Administration
- Service Dispatch

**Bottom Tier (Supporting/Enabling):**
- Product Management BBOM
- Finance & Reimbursement

**External (Outside Boundary):**
- Retail POS Systems
- CRM System
- Servicer Management System

## Domain Distillation Analysis

### Core Domain

**Contract Administration**
- High business differentiation (ACL strategy, multi-channel integration)
- High model complexity (Contract aggregate, validation rules, effective date logic)
- Competitive advantage through efficient contract processing
- Position: Upper-right quadrant (x: 80, y: 75)

**Claims Management**
- High business differentiation (claim state machine, limit of liability rules, fulfillment decision logic)
- Very high model complexity (state transitions, cost tracking, authorization rules)
- Critical business risk management - this is where money is won or lost
- Position: Upper-right quadrant (x: 85, y: 80)

### Supporting Domain

**Lead Management**
- Medium business differentiation (marketing campaign optimization)
- Medium-low model complexity (contact records, expiration tracking)
- Supports customer acquisition but not core competitive advantage
- Position: Middle quadrant (x: 50, y: 35)

**Service Dispatch**
- Medium differentiation (technician matching, repair coordination)
- Medium complexity (PO management, cost tracking)
- Orchestrates fulfillment but repair quality isn't primary differentiator
- Position: Middle quadrant (x: 55, y: 40)

**Reporting**
- Medium-low differentiation (standard BI/analytics)
- Low-medium complexity (conformist with upstream models)
- Provides visibility but not competitive advantage
- Position: Middle-lower quadrant (x: 45, y: 30)

### Generic Domain

**Product Management (BBOM)**
- Low differentiation (commodity product catalog function)
- Medium-high complexity (legacy system, tangled model)
- Generic function + legacy debt = no competitive advantage despite complexity
- Position: Left quadrant (x: 15, y: 60)

**Finance & Reimbursement**
- Low differentiation (standard accounting operations)
- Low complexity (payment processing, store credit issuance)
- Generic back-office function
- Position: Left-lower quadrant (x: 20, y: 25)

## Teaching Moments

### 1. Multiple ACLs Protecting Core Domain

Contract Administration is heavily defended with ACLs from:
- Product Management (simplification: Product → Covered Product)
- Lead Management (translation: Lead → Customer + Contract)
- Multiple Retail POS systems (normalization: proprietary formats → Contract model)

**Discussion**: Why so many ACLs? What does this tell us about Contract Administration's strategic importance?

### 2. Shared Kernel Trade-offs

Claims Management ↔ Service Dispatch share domain concepts.

**Discussion**:
- What concepts might they share? (Claim entity? Repair cost tracking?)
- What's the coordination cost? (Teams must sync on changes)
- Why not separate them? (Close collaboration needed, shared understanding critical)
- When is shared kernel worth the coupling?

### 3. Conformist Pattern in Analytics

Reporting conforms to all upstream domains without translation.

**Discussion**:
- Why is conformist acceptable here? (Read-only, no core business logic)
- What's the trade-off? (Lower dev cost, higher coupling)
- When would you add an ACL instead? (If Reporting had complex domain logic)

### 4. Entity vs Value Object Across Contexts

Product is an Entity in Product Management (identity, lifecycle).
Covered Product is a Value Object in Contract Administration (immutable, no identity beyond attributes).

**Discussion**: How does the same business concept take different forms in different contexts?

### 5. Strategic Classification Despite Complexity

Product Management (BBOM) is Generic despite high model complexity.

**Discussion**: Complexity ≠ Strategic importance. Generic function + legacy = no competitive advantage.

### 6. Separate Customer Acquisition Channels

POS customers and Lead-converted customers remain in separate pools.

**Discussion**:
- Why keep them separate? (Different business processes, departments, data sources)
- Do they ever merge? (No - different lifecycle, different renewal patterns)
- What does this tell us about business organization?

### 7. Open Host Service as Published Integration

Claims Management publishes OHS API for CRM integration.

**Discussion**:
- Who defines the contract? (Claims - upstream authority)
- Why OHS instead of ACL? (Claims wants to control integration points, CRM is conforming)
- What's the benefit? (Stable integration, multiple consumers could use same API)

### 8. Upstream vs Downstream: Who Has Power?

Claims → Finance relationship demonstrates a subtle but important concept.

**Scenario**: Claims authorizes reimbursements, Finance executes payments. Who is upstream?

**Answer**: Finance is upstream, even though Claims initiates the action.

**Why?** Finance owns the payment API schema. If Finance changes their API structure, Claims must update their ACL translation layer. Claims adapts to Finance, not vice versa.

**Discussion**:
- Upstream = owns the integration contract/schema
- Downstream = must adapt when upstream changes
- Power isn't about "who calls who" - it's about "who defines the contract"
- Core domains often have ACLs protecting from generic systems (Finance, Reporting) that own rigid schemas
- Example: Even though Claims (Core) is more strategically important than Finance (Generic), Finance dictates the integration terms

## Strategic Design Implications

### Investment Priorities

**Maximize investment in Core:**
- Contract Administration: Multi-channel integration excellence, validation rule engine
- Claims Management: Claim decision automation, fraud detection, optimal fulfillment routing

**Sufficient investment in Supporting:**
- Lead Management: Campaign effectiveness tracking
- Service Dispatch: Technician quality scoring
- Reporting: Real-time dashboards

**Minimize investment in Generic:**
- Finance: Use standard accounting packages
- Product Management: Modernize BBOM or replace with commercial product catalog solution

### Boundary Protection Strategy

Protect core contexts (Contract Admin, Claims) with strong ACLs from:
- Legacy systems (Product Management BBOM)
- External volatility (Retail POS formats, Servicer API changes)
- Generic functions (Finance)

### Team Topology Recommendations

**Stream-aligned teams:**
- Contract & Claims Team (owns partnership relationship, high coordination)
- Acquisition Team (Lead Management, maybe Contract Admin integration)
- Fulfillment Team (Service Dispatch, Servicer integration)

**Platform team:**
- Data Platform (Reporting, analytics infrastructure)

**Enabling team:**
- Legacy Integration (Product Management BBOM modernization support)
