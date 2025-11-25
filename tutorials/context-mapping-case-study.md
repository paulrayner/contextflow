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

Let's discover the bounded contexts by following David's journey. We're not judging importance yet—just mapping what exists.

### What's a Bounded Context?

A **bounded context** is a boundary within which a particular domain model applies. Inside that boundary, terms have precise meaning and specific rules are enforced. The same word might mean different things in different contexts—or mean nothing at all outside its home context.

---

## Chapter 1: Where Contracts Live

David had a warranty contract before he ever filed a claim. That contract specified what product was covered, the coverage terms, effective dates, and customer information. What bounded context manages warranty contracts? (For this first pass, it's fine to just use the application or system name.)

Look for where contracts are created, validated, and stored. This is the authoritative source for "does this customer have coverage?"

**Contract Administration** — Where warranty contracts live. Manages contract lifecycle: creation, validation, covered products, customer data. Contains rules for effective dates, coverage terms, and eligibility.

### Actor

**Warranty Administrator** — needs to **manage contracts and customer accounts**

**Add to your map**:
1. Draw/add the **Contract Administration** context (internal)
2. Draw/add **Warranty Administrator** actor
3. Add user need: "Manage contracts and customer accounts"
4. Connect: Actor → Need → Context

---

## Chapter 2: Filing a Claim

When David's dishwasher broke, he called to report it. The CSR opened a claim, and over the following weeks that claim tracked repair attempts, accumulated costs, and eventually triggered a reimbursement.

In your EventStorming, you explored this part of the journey—opening the claim, tracking repair attempts, calculating costs against the limit of liability, and eventually closing the claim. What bounded context owns this lifecycle?

> **Discussion**: Could Claims and Contract Administration be the same context? What would that look like?

**Claims Management** — Owns the claim lifecycle: opening, tracking repair attempts, calculating limit of liability, and authorizing fulfillment.

The domain model includes a Claim aggregate with a state machine (open → closed → reopened). This is where business rules determine repair vs. reimburse decisions.

### The CSR's Toolbox

When David called, the CSR needed to see his contact history—previous calls, notes from other CSRs. Where does that live?

**CRM System** (External) — Tracks customer contact history. Used by CSRs during claim processing. Third-party system (Salesforce, etc.)

### Actors

- **Customer Service Representative (CSR)** — needs to **process claim intake**
- **Warranty Customer** (David) — needs to **file and track claims**

**Add to your map**:
1. Draw/add **Claims Management** context (internal)
2. Draw/add **CRM System** context (external) — mark it as external
3. Draw/add **Customer Service Representative** actor with need "Process claim intake"
4. Draw/add **Warranty Customer** actor with need "File and track claims"
5. Connect each: Actor → Need → Context

---

## Chapter 3: Getting the Repair Done

David's claim is approved. Now what? In your EventStorming, you traced what happens next—coordinating technicians, executing repairs, recording costs. What contexts handle repair fulfillment?

**Service Dispatch**
- Coordinates repair work orders
- Creates purchase orders to the service network
- Tracks repair costs and parts

**Servicer Management System** (External)
- Third-party network that dispatches technicians
- Coordinates scheduling and field service
- Returns cost data to Service Dispatch

### Actors

- **Claims Specialist/Adjudicator** — needs to **adjudicate claims and authorize fulfillment**
- **Service Technician** — needs to **execute repair work orders**

**Add to your map**:
1. Draw/add **Service Dispatch** context (internal)
2. Draw/add **Servicer Management System** context (external)
3. Draw/add **Claims Specialist/Adjudicator** actor with need "Adjudicate claims and authorize fulfillment"
4. Draw/add **Service Technician** actor with need "Execute repair work orders"
5. Connect each: Actor → Need → Context

---

## Chapter 4: When Repair Doesn't Work

After three repair attempts, David's dishwasher still wasn't fixed. The repair costs were approaching the product's replacement value. Time for a reimbursement. What context handles payments?

**Finance & Reimbursement**
- Processes payments and store credits
- Issues reimbursement when costs exceed limit of liability

### Actor

**Accountant** — needs to **process reimbursements and payments**

**Add to your map**:
1. Draw/add **Finance & Reimbursement** context (internal)
2. Draw/add **Accountant** actor with need "Process reimbursements and payments"
3. Connect: Actor → Need → Context

---

## Checkpoint: Core Journey Complete

Your map should now have **6 contexts** (4 internal, 2 external) and **6 actors** with their needs connected. If you're missing any, go back and add them before continuing.

---

## Chapter 5: Where Did the Contract Come From?

We've followed David's journey from claim to repair to reimbursement. But step back: how did David get a warranty contract in the first place? There are two different ways customers get extended warranties:

**Lead Management**
- Tracks prospects approaching manufacturer warranty expiration
- Executes marketing campaigns
- Maintains a separate leads database

**Retail POS Systems** (External)
- Point of sale systems at retail partners (Best Buy, Home Depot, etc.)
- Each retailer sends data in a different format
- **External context** — Elan doesn't own these systems

### Why Two Paths Stay Separate

POS-originated warranties and lead-converted warranties remain in separate pipelines. Different departments, different business rules. This reflects genuine domain complexity, not poor design.

### Actors

- **Marketing Specialist** — needs to **execute lead campaigns**
- **Appliance Sales Representative** — needs to **sell warranties at POS**

**Add to your map**:
1. Draw/add **Lead Management** context (internal)
2. Draw/add **Retail POS Systems** context (external)
3. Draw/add **Marketing Specialist** actor with need "Execute lead campaigns"
4. Draw/add **Appliance Sales Representative** actor with need "Sell warranties at POS"
5. Connect each: Actor → Need → Context

---

## Chapter 6: Product Data

David's contract covers a specific product: his dishwasher. Where does product eligibility data come from? What system knows which products are eligible for warranty coverage?

**Product Management** — The product catalog that defines what's eligible for coverage.

This is a legacy system with tangled dependencies—what Foote and Yoder call a "[Big Ball of Mud](http://www.laputan.org/mud/)." The Product entity contains far more detail than downstream systems need.

### Actor

**Underwriting & Product Manager** — needs to **manage product catalog and coverage rules**

**Add to your map**:
1. Draw/add **Product Management** context (internal)
2. Draw/add **Underwriting & Product Manager** actor with need "Manage product catalog and coverage rules"
3. Connect: Actor → Need → Context

---

## Chapter 7: Who Sees the Big Picture?

Managers need visibility into business performance. How many claims are open? What's the average repair cost? Which servicers perform best?

**Reporting**
- Dashboards for managers and analysts
- Operational reports for CSRs
- Analytics on claim patterns, repair costs, contract performance

**Add to your map**:
1. Draw/add **Reporting** context (internal)

(Reporting serves multiple actors—managers, analysts, CSRs—but we won't add separate actor-need connections for this exercise.)

---

## Chapter 8: Your Complete Context Inventory

You should now have **10 bounded contexts**:

| Context | Internal/External |
|---------|-------------------|
| Contract Administration | Internal |
| Claims Management | Internal |
| CRM System | External |
| Service Dispatch | Internal |
| Servicer Management System | External |
| Finance & Reimbursement | Internal |
| Lead Management | Internal |
| Retail POS Systems | External |
| Product Management | Internal |
| Reporting | Internal |

And **9 actors** with their user needs:

| Actor | User Need |
|-------|-----------|
| Warranty Administrator | Manage contracts and customer accounts |
| Warranty Customer | File and track claims |
| Customer Service Representative | Process claim intake |
| Claims Specialist/Adjudicator | Adjudicate claims and authorize fulfillment |
| Service Technician | Execute repair work orders |
| Accountant | Process reimbursements and payments |
| Marketing Specialist | Execute lead campaigns |
| Appliance Sales Representative | Sell warranties at POS |
| Underwriting & Product Manager | Manage product catalog and coverage rules |

**Verification**: Count your contexts and actors. You should have **10 contexts** and **9 actors**. If your numbers don't match, review before adding relationships.

---

## Chapter 9: Adding Relationships

How do these contexts connect? DDD defines specific **relationship patterns**.

### Anti-Corruption Layer (ACL)

An **Anti-Corruption Layer** is a translation layer that protects one context's domain model from another's.

**Example: Contract Administration → Product Management**

Product Management's Product entity is complex—full specifications, legacy cruft. But Contract Administration only needs Brand-Make-Model-SKU.

Contract Administration uses an ACL to translate Product into a simple **Covered Product** value object. Same business concept, different forms: Entity in one context, Value Object in another.

**Where else does Contract Administration need ACLs?**

- **Retail POS Systems** — Each retailer sends proprietary formats. Multiple ACLs normalize incoming data.
- **Lead Management** — Lead data has different structure than POS transactions. Another ACL translates leads into contracts.

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

*Note: Arrows show dependency direction (who adapts to whom), not data flow. CRM depends on Claims Management's published API.*

---

## Checkpoint: Relationships Complete

Your map should now show **11 relationships**. If you have fewer, check: Did you add the three Conformist relationships from Reporting?

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

## Chapter 10: The Three Classifications

Not all contexts are equally important:

- **Core Domain** — Competitive advantage. Maximum investment. If you get these wrong, you lose.
- **Supporting Domain** — Important but not differentiating. Enables the core.
- **Generic Domain** — Commodity functions. Buy, don't build.

### Exercise: Classify Each Context

Before reading ahead, classify all 10 contexts. Ask:
- Does this provide competitive advantage?
- Would a competitor's version look different?
- Could we buy this off-the-shelf?

> **Discussion**: Your team argues Product Management should be Core because it's complex and causes pain. How would you respond?

**Core Domain**
- **Claims Management** — Where Elan makes or loses money. The repair-vs-reimburse decision rules are business expertise.
- **Contract Administration** — Complex validation rules, multi-channel integration. Proprietary business logic.

**Supporting Domain**
- **Lead Management** — Enables acquisition but isn't core competency.
- **Service Dispatch** — Coordinates repairs but isn't the differentiator.
- **Reporting** — Important for visibility but could use any BI tool.
- **Product Management** — Custom-built system that *should* be generic, but isn't. We built it in-house, so it's Supporting.

**Generic Domain**
- **Finance & Reimbursement** — Standard accounting. Could be replaced with off-the-shelf solution.
- **Retail POS Systems** — External commodity integrations.
- **CRM System** — External commodity system.
- **Servicer Management System** — External service network.

---

## Chapter 11: The Core Domain Chart

The **Core Domain Chart** positions contexts on two axes:

- **Business Differentiation** (Y-axis): Competitive advantage?
- **Model Complexity** (X-axis): Sophisticated domain model?

**Upper Right** = Core (Claims Management, Contract Administration)
**Middle** = Supporting (Lead Management, Service Dispatch, Reporting)
**Lower Left** = Generic (everything else)

### The Product Management Puzzle

**Product Management is Supporting despite being complex.** (It's a Big Ball of Mud, remember?)

Product catalog management *could* be Generic—you could buy a PIM (Product Information Management) system off the shelf. But Elan built this in-house, which makes it Supporting. Custom-built = Supporting, regardless of whether the domain *should* be generic.

Complexity ≠ strategic importance. The complexity here is *accidental* (technical debt) not *essential* (business sophistication).

**Investment implication**: The right move may be to replace it with a commercial solution—at which point it *would* become Generic. Until then, it's Supporting: we built it, we maintain it, but it doesn't differentiate us.

---

## Chapter 12: Why ACLs Cluster Around Core

Look at the relationship map. Contract Administration has three ACLs:
- From Product Management (legacy complexity)
- From Retail POS (external format volatility)
- From Lead Management (different data structures)

Core domains justify protection investment. ACLs keep the domain model clean while adapting to messy realities.

> **Discussion**: Contract Administration has three ACLs. Claims Management has one. Is this intentional or accidental? What does it tell you about where to invest in boundary protection?

---

## Domain Distillation Complete

- 2 Core domains (Claims Management, Contract Administration)
- 4 Supporting domains (Lead Management, Service Dispatch, Reporting, Product Management)
- 4 Generic domains (Finance & Reimbursement, Retail POS, CRM, Servicer Management)

This guides investment: maximum resources to Core, sufficient to Supporting, minimum to Generic.

---

## Checkpoint: Classifications Complete

You should have **2 Core**, **4 Supporting**, and **4 Generic** contexts. If your counts differ, revisit: Does this provide competitive advantage? Did we build it, or buy it off-the-shelf?

---

# Part III: Strategic View

A brief look at evolution and visibility.

---

## Chapter 13: Evolution

Contexts vary by how commoditized they are:

- **Genesis** — Experimental, uncertain
- **Custom-built** — Built for this business
- **Product** — Off-the-shelf with customization
- **Commodity** — Standard, interchangeable

**Pattern**: Core domains tend to be custom-built (that's where you differentiate). Generic domains tend to be commodity (use standard solutions).

This reinforces Domain Distillation: invest in custom-building your core, use commodities for generic.

---

## Chapter 14: Putting It All Together

Three views, three questions answered:

**Value Stream View**: What exists? How does it connect?
**Domain Distillation View**: What's strategically important?
**Strategic View**: Where should we invest?

---

# Part IV: Key Insights

These eight patterns appear repeatedly in context mapping. As you encounter new domains, look for them:

1. **Multiple ACLs protect core domains** — Contract Administration has three. Worth the investment.

2. **Shared kernels require coordination** — Claims and Service Dispatch share repair cost concepts. Keep shared kernels small.

3. **Conformist works for analytics** — Reporting accepts upstream models. Acceptable for read-only contexts.

4. **Same concept, different forms** — Product is an Entity in Product Management, a Value Object in Contract Administration.

5. **Complex ≠ strategic** — Product Management is Supporting despite being a Big Ball of Mud. The distinction: Generic means you bought it off-the-shelf; Supporting means you built it. Product Management *could* become Generic if replaced with a commercial PIM.

6. **Separate paths stay separate** — POS and Lead pipelines reflect genuine domain complexity.

7. **OHS for external integration** — Claims publishes API for CRM. Upstream defines the contract.

8. **Upstream = power** — Finance is upstream of Claims because Finance owns the payment schema.

---

## Reference

Compare your work against:
- [Completed solution in ContextFlow](https://contextflow.dev/?project=elan-warranty)
- [Full domain analysis](../docs/elan-warranty-domain.md)

### Practice: Map Your Own Domain

Apply this process to a domain you know:

**Part I: Value Stream View**
1. Pick a user journey (like David's warranty claim)
2. Walk through step by step: What happens first? What system handles it? Who's involved?
3. For each step, identify: the context (system/application), the actor, and their need
4. Note which contexts are internal (you own them) vs external (third-party)
5. After completing the journey, ask: What upstream systems feed into this? (Like Lead Management and Retail POS)
6. Add relationships between contexts—what patterns apply?

**Part II: Domain Distillation View**
7. For each context, ask: Does this provide competitive advantage?
8. Then ask: Did we build it, or buy it off-the-shelf?
   - Built in-house + differentiating → Core
   - Built in-house + not differentiating → Supporting
   - Off-the-shelf/external → Generic

**Part III: Strategic View**
9. Position contexts by evolution stage (genesis → commodity)
10. Look for mismatches: Core domains using commodity solutions? Supporting domains with excessive investment?
