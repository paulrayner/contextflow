# Context Mapping Case Study: Elan Extended Warranty

A step-by-step guide to building a context map from the domain you've already explored.

---

## Introduction

You've already walked through David and Claudia's warranty journey and EventStormed the domain. You identified events like "Claim Opened", "Repair Attempted", "Contract Terminated", and "Reimbursement Requested". Now it's time to organize what you discovered into a **context map**.

**Context mapping** identifies the distinct areas of the business where different models and language apply, and how those areas integrate. Where EventStorming shows you the flow of events, context mapping groups those events into distinct areas—each with its own language and rules—and shows how those areas integrate. So EventStorming reveals *what happens*, and context mapping reveals *where it happens* and *how the pieces connect*. In context mapping, we **always map what is**.

### What You'll Build

By the end of this exercise, you'll have:
- **10 bounded contexts** organized into a value stream
- **9 actors** connected to their user needs
- **11 relationships** between contexts using DDD patterns
- **Strategic classifications** for investment decisions

### The Three Views

We'll build the context map in three phases:

1. **Value Stream View** — Discover contexts, actors, and relationships. Focus on *what exists*.
2. **Domain Distillation View** — Classify contexts as Core, Supporting, or Generic. Focus on *strategic importance*.
3. **Strategic View** — Position contexts by evolution. Focus on *investment decisions*.

---

# Part I: Value Stream View

Let's discover the bounded contexts. We're not judging importance yet—just mapping what exists.

---

## Chapter 1: Where Claims Live

Remember when David called to report his broken dishwasher? The CSR opened a claim, and over the following weeks that claim tracked repair attempts, accumulated costs, and eventually triggered a reimbursement.

In your EventStorming, you likely identified events like:
- "Claim Opened"
- "Repair Attempt Recorded"
- "Limit of Liability Calculated"
- "Reimbursement Authorized"
- "Claim Closed"

**Think about it**: What bounded context owns these events?

<details>
<summary>Hint</summary>

Look for events that share a common lifecycle and language around claims, repair tracking, and fulfillment decisions.

</details>

<details>
<summary>Reveal</summary>

**Claims Management** — This context owns the claim lifecycle: opening, tracking repair attempts, calculating limit of liability, and authorizing fulfillment.

The domain model includes a Claim aggregate with a state machine (open → closed → reopened). This is where business rules determine repair vs. reimburse decisions.

</details>

### What's a Bounded Context?

A **bounded context** is a boundary within which a particular domain model applies. Inside that boundary, terms have precise meaning and specific rules are enforced. "Claim" means something specific in Claims Management—it might mean something different (or nothing) elsewhere.

### Actors and User Needs

Who uses Claims Management?
- **Customer Service Representative (CSR)** — needs to **process claim intake**
- **Warranty Customer** (David) — needs to **file and track claims**

**Add to your map**: Claims Management context with CSR and Customer as actors.

---

## Chapter 2: Where Warranties Come From

Before David could file a claim, he needed a warranty contract. How did that come to exist?

**Think about it**: David's warranty could have originated from two completely different places. What are they?

<details>
<summary>Hint</summary>

One involves buying the warranty when purchasing the appliance. The other involves Elan's marketing team reaching out before the manufacturer warranty expires.

</details>

<details>
<summary>Reveal</summary>

**Point of Sale** — Customers buy extended warranties at retail stores (Best Buy, Home Depot) when purchasing appliances. The retailer sends transaction data to Elan.

**Lead Marketing** — Elan identifies customers whose manufacturer warranties are expiring and sends targeted mailings. These prospects may convert to warranty customers.

</details>

### Three More Contexts

These two paths, plus where contracts actually live, give us three contexts:

**Retail POS Systems** (External)
- Point of sale systems at retail partners
- Each retailer sends data in a different format
- **External context** — Elan doesn't own these systems

**Lead Management**
- Tracks prospects approaching manufacturer warranty expiration
- Executes marketing campaigns
- Maintains a separate leads database

**Contract Administration**
- Where warranty contracts live
- Manages contract lifecycle: creation, validation, covered products, customer data
- Contains rules for effective dates, coverage terms, eligibility

### Why Two Paths Stay Separate

POS-originated warranties and lead-converted warranties remain in separate pipelines. Different departments, different business rules. This reflects genuine domain complexity, not poor design.

### Actors

- **Appliance Sales Representative** — needs to **sell warranties at POS**
- **Marketing Specialist** — needs to **execute lead campaigns**
- **Warranty Administrator** — needs to **manage contracts and customer accounts**

**Add to your map**: Retail POS (external), Lead Management, and Contract Administration.

---

## Chapter 3: What Products Are Covered?

David's contract covers a specific product: a Bosch dishwasher. Where does product data come from?

**Think about it**: What system knows which products are eligible for warranty coverage?

<details>
<summary>Hint</summary>

It's a legacy system. Teams complain about it.

</details>

<details>
<summary>Reveal</summary>

**Product Management (BBOM)** — The product catalog that defines what's eligible for coverage.

BBOM stands for "Big Ball of Mud"—a legacy system with tangled dependencies. The Product entity contains far more detail than downstream systems need.

</details>

### Actor

**Underwriting & Product Manager** — needs to **manage product catalog and coverage rules**

**Add to your map**: Product Management (BBOM).

---

## Chapter 4: Getting the Repair Done

David's claim is approved. Now what? You EventStormed events like "Work Order Created", "Technician Dispatched", "Repair Completed", "Repair Cost Recorded".

**Think about it**: What contexts handle fulfillment?

<details>
<summary>Hint</summary>

Consider: Who coordinates the repair? Who actually does the repair? Who issues the reimbursement check?

</details>

<details>
<summary>Reveal</summary>

**Service Dispatch**
- Coordinates repair work orders
- Creates purchase orders to the service network
- Tracks repair costs and parts

**Servicer Management System** (External)
- Third-party network that dispatches technicians
- Coordinates scheduling and field service
- Returns cost data to Service Dispatch

**Finance & Reimbursement**
- Processes payments and store credits
- Issues reimbursement when costs exceed limit of liability

</details>

### Actors

- **Claims Specialist/Adjudicator** — needs to **adjudicate claims and authorize fulfillment**
- **Service Technician** — needs to **execute repair work orders**
- **Accountant** — needs to **process reimbursements and payments**

**Add to your map**: Service Dispatch, Servicer Management System (external), and Finance & Reimbursement.

---

## Chapter 5: Analytics and Customer Tracking

Two more contexts round out the system:

**Reporting**
- Dashboards for managers and analysts
- Operational reports for CSRs
- Analytics on claim patterns, repair costs, contract performance

**CRM System** (External)
- Tracks customer contact history
- Used by CSRs during claim processing
- Third-party system (Salesforce, etc.)

---

## Chapter 6: Your Complete Context Inventory

You should now have **10 bounded contexts**:

| Context | Internal/External |
|---------|-------------------|
| Claims Management | Internal |
| Contract Administration | Internal |
| Lead Management | Internal |
| Service Dispatch | Internal |
| Reporting | Internal |
| Product Management (BBOM) | Internal |
| Finance & Reimbursement | Internal |
| Retail POS Systems | External |
| CRM System | External |
| Servicer Management System | External |

And **9 actors** with their user needs:

| Actor | User Need |
|-------|-----------|
| Warranty Customer | File and track claims |
| Customer Service Representative | Process claim intake |
| Appliance Sales Representative | Sell warranties at POS |
| Marketing Specialist | Execute lead campaigns |
| Warranty Administrator | Manage contracts and customer accounts |
| Underwriting & Product Manager | Manage product catalog and coverage rules |
| Claims Specialist/Adjudicator | Adjudicate claims and authorize fulfillment |
| Service Technician | Execute repair work orders |
| Accountant | Process reimbursements and payments |

---

## Chapter 7: Adding Relationships

How do these contexts connect? DDD defines specific **relationship patterns**.

### Anti-Corruption Layer (ACL)

An **Anti-Corruption Layer** is a translation layer that protects one context's domain model from another's.

**Example: Contract Administration → Product Management**

Product Management's Product entity is complex—full specifications, legacy cruft. But Contract Administration only needs Brand-Make-Model-SKU.

Contract Administration uses an ACL to translate Product into a simple **Covered Product** value object. Same business concept, different forms: Entity in one context, Value Object in another.

**Where else does Contract Administration need ACLs?**

<details>
<summary>Reveal</summary>

- **Retail POS Systems** — Each retailer sends proprietary formats. Multiple ACLs normalize incoming data.
- **Lead Management** — Lead data has different structure than POS transactions. Another ACL translates leads into contracts.

</details>

Contract Administration has three ACLs protecting it. This isn't accidental—it's protecting itself from volatility on all sides.

### Partnership

A **Partnership** is a symmetric relationship where two contexts collaborate closely. Changes in one require coordinated changes in the other.

**Example: Contract Administration ↔ Claims Management**

These contexts are tightly coupled:
- Claims validate against contract terms and coverage rules
- Both must agree on what "contract fulfilled" means
- They may share database access or domain events

### Shared Kernel

A **Shared Kernel** is a subset of the domain model shared between contexts. Both teams coordinate on changes.

**Example: Claims Management ↔ Service Dispatch**

These contexts share concepts around repair cost tracking and limit of liability calculation. When a repair PO returns with costs, both contexts need to understand what that means.

**Trade-off**: Shared kernels reduce duplication but increase coordination cost.

### Conformist

A **Conformist** accepts the upstream context's model without translation.

**Example: Reporting → Claims / Contract Admin / Service Dispatch**

Reporting reads data via database views or ETL, accepting upstream models as-is. No ACL, no translation. This works because Reporting has no complex domain logic—it's read-only analytics.

### Open Host Service (OHS)

An **Open Host Service** is a well-defined API published for downstream consumers.

**Example: Claims Management → CRM System**

Claims Management publishes an API that CRM consumes. Claims defines the contract; CRM conforms.

**Key insight**: "Upstream" and "downstream" describe *power*, not data flow. The upstream context defines the integration contract. Claims is upstream of CRM because Claims owns the API definition.

### One More ACL

**Claims Management → Finance**

Claims sends reimbursement authorizations to Finance. But Finance owns the payment API schema. If Finance changes their format, Claims must adapt. **Finance is upstream.**

This is counterintuitive—Claims adapts to Finance, not vice versa. But commodity systems often have rigid interfaces.

### Your Complete Relationship Map

| Relationship | Pattern | Notes |
|-------------|---------|-------|
| Contract Admin → Product Mgmt | ACL | Simplifies Product → Covered Product |
| Contract Admin → Retail POS | ACL | Multiple ACLs, one per retailer |
| Contract Admin → Lead Mgmt | ACL | Translates lead data to contracts |
| Contract Admin ↔ Claims Mgmt | Partnership | Tight collaboration |
| Claims Mgmt ↔ Service Dispatch | Shared Kernel | Repair cost tracking |
| Claims Mgmt → Finance | ACL | Claims adapts to Finance's schema |
| Service Dispatch → Servicer System | ACL | Protects from 3rd party API changes |
| CRM → Claims Mgmt | OHS | Claims publishes API for CRM |
| Reporting → Contract Admin | Conformist | Read-only analytics |
| Reporting → Claims Mgmt | Conformist | Read-only analytics |
| Reporting → Service Dispatch | Conformist | Read-only analytics |

---

## Value Stream View Complete

You've mapped:
- 10 bounded contexts
- 9 actors with user needs
- 11 relationships with specific patterns

This is the foundation. Next, we'll classify these contexts by strategic importance.

---

# Part II: Domain Distillation View

Now we classify contexts by strategic value.

---

## Chapter 8: The Three Classifications

Not all contexts are equally important:

- **Core Domain** — Competitive advantage. Maximum investment. If you get these wrong, you lose.
- **Supporting Domain** — Important but not differentiating. Enables the core.
- **Generic Domain** — Commodity functions. Buy, don't build.

### Exercise: Classify Each Context

Before reading ahead, classify all 10 contexts. Ask:
- Does this provide competitive advantage?
- Would a competitor's version look different?
- Could we buy this off-the-shelf?

<details>
<summary>Reveal Classifications</summary>

**Core Domain**
- **Claims Management** — Where Elan makes or loses money. The repair-vs-reimburse decision rules are business expertise.
- **Contract Administration** — Complex validation rules, multi-channel integration. Proprietary business logic.

**Supporting Domain**
- **Lead Management** — Enables acquisition but isn't core competency.
- **Service Dispatch** — Coordinates repairs but isn't the differentiator.
- **Reporting** — Important for visibility but could use any BI tool.

**Generic Domain**
- **Product Management (BBOM)** — Product catalogs are commodity functions.
- **Finance & Reimbursement** — Standard accounting. Could be replaced.
- **Retail POS Systems** — External commodity integrations.
- **CRM System** — External commodity system.
- **Servicer Management System** — External service network.

</details>

---

## Chapter 9: The Core Domain Chart

The **Core Domain Chart** positions contexts on two axes:

- **Business Differentiation** (Y-axis): Competitive advantage?
- **Model Complexity** (X-axis): Sophisticated domain model?

**Upper Right** = Core (Claims Management, Contract Administration)
**Middle** = Supporting (Lead Management, Service Dispatch, Reporting)
**Lower Left** = Generic (everything else)

### The Product Management Puzzle

**Product Management is Generic despite being complex.**

Complexity ≠ strategic importance. Product catalog management is commodity function. The complexity is *accidental* (technical debt) not *essential* (business sophistication).

**Investment implication**: Minimize investment. Consider replacing with commercial solution. Don't mistake technical pain for strategic importance.

---

## Chapter 10: Why ACLs Cluster Around Core

Look at the relationship map. Contract Administration has three ACLs:
- From Product Management (legacy complexity)
- From Retail POS (external format volatility)
- From Lead Management (different data structures)

Core domains justify protection investment. ACLs keep the domain model clean while adapting to messy realities.

---

## Domain Distillation Complete

- 2 Core domains (Claims Management, Contract Administration)
- 3 Supporting domains (Lead Management, Service Dispatch, Reporting)
- 5 Generic domains (everything else)

This guides investment: maximum resources to Core, sufficient to Supporting, minimum to Generic.

---

# Part III: Strategic View

A brief look at evolution and visibility.

---

## Chapter 11: Evolution

Contexts vary by how commoditized they are:

- **Genesis** — Experimental, uncertain
- **Custom-built** — Built for this business
- **Product** — Off-the-shelf with customization
- **Commodity** — Standard, interchangeable

**Pattern**: Core domains tend to be custom-built (that's where you differentiate). Generic domains tend to be commodity (use standard solutions).

This reinforces Domain Distillation: invest in custom-building your core, use commodities for generic.

---

## Chapter 12: Putting It All Together

Three views, three questions answered:

**Value Stream View**: What exists? How does it connect?
**Domain Distillation View**: What's strategically important?
**Strategic View**: Where should we invest?

---

# Part IV: Key Insights

1. **Multiple ACLs protect core domains** — Contract Administration has three. Worth the investment.

2. **Shared kernels require coordination** — Claims and Service Dispatch share repair cost concepts. Keep shared kernels small.

3. **Conformist works for analytics** — Reporting accepts upstream models. Acceptable for read-only contexts.

4. **Same concept, different forms** — Product is an Entity in Product Management, a Value Object in Contract Administration.

5. **Complex ≠ strategic** — Product Management (BBOM) is Generic despite being complex.

6. **Separate paths stay separate** — POS and Lead pipelines reflect genuine domain complexity.

7. **OHS for external integration** — Claims publishes API for CRM. Upstream defines the contract.

8. **Upstream = power** — Finance is upstream of Claims because Finance owns the payment schema.

---

## Reference

Compare your work against:
- [Full domain analysis](../docs/elan-warranty-domain.md)
- [Sample project file](../examples/elan-warranty.project.json)

### Practice

1. Pick a domain you know and identify its bounded contexts
2. For each Generic context, ask "what would make this Core?"
3. What if Claims and Service Dispatch weren't a shared kernel?
