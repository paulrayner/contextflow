# Elan Extended Warranty - Strategic View Plan

## Actors (9)

### 1. Appliance Sales Representative (position: 10)
**Description**: Retail POS staff at Best Buy, Home Depot, etc. who sell warranties at point of purchase

**User Need**:
- **Sell warranties at POS**
  - Retail POS Systems

---

### 2. Warranty Customer (position: 15)
**Description**: End customers who purchased extended warranties and need to file claims when products fail

**User Need**:
- **File and track claims**
  - Claims Management

---

### 3. Marketing Specialist (position: 20)
**Description**: Staff executing lead campaigns and converting prospects approaching manufacturer warranty expiration

**User Need**:
- **Execute lead campaigns**
  - Lead Management
  - Reporting

---

### 4. Warranty Administrator (position: 25)
**Description**: Staff managing contract creation, client relationships, and POS integration configurations

**User Need**:
- **Manage contracts and customer accounts**
  - Contract Administration
  - Lead Management

---

### 5. Underwriting & Product Manager (position: 35)
**Description**: Staff defining coverage rules, pricing models, and eligible product catalog

**User Need**:
- **Manage product catalog and coverage rules**
  - Product Management (BBOM)
  - Contract Administration

---

### 6. Customer Service Representative (CSR) (position: 45)
**Description**: Frontline staff who process claims and coordinate customer communication

**User Need**:
- **Process claim intake**
  - Claims Management
  - CRM System

---

### 7. Claims Specialist/Adjudicator (position: 55)
**Description**: Expert staff analyzing complex claims, calculating limit of liability, and determining fulfillment strategies

**User Need**:
- **Adjudicate claims and authorize fulfillment**
  - Claims Management
  - Service Dispatch

---

### 8. Service Technician (position: 60)
**Description**: Field technicians (working for external servicer network) who execute repair work orders

**User Need**:
- **Execute repair work orders**
  - Servicer Management System

---

### 9. Accountant (position: 70)
**Description**: Finance staff processing reimbursements, store credits, and payment reconciliation

**User Need**:
- **Process reimbursements and payments**
  - Finance & Reimbursement

---

## Summary

**Total Counts:**
- **9 actors**
- **9 user needs** (one primary need per actor)
- **~17 need-context connections**

## Actor-Need Connections

| Actor | User Need |
|-------|-----------|
| Appliance Sales Representative | Sell warranties at POS |
| Warranty Customer | File and track claims |
| Marketing Specialist | Execute lead campaigns |
| Warranty Administrator | Manage contracts and customer accounts |
| Underwriting & Product Manager | Manage product catalog and coverage rules |
| Customer Service Representative (CSR) | Process claim intake |
| Claims Specialist/Adjudicator | Adjudicate claims and authorize fulfillment |
| Service Technician | Execute repair work orders |
| Accountant | Process reimbursements and payments |

## Need-Context Connections

| User Need | Connected Contexts |
|-----------|-------------------|
| Sell warranties at POS | Retail POS Systems |
| File and track claims | Claims Management |
| Execute lead campaigns | Lead Management, Reporting |
| Manage contracts and customer accounts | Contract Administration, Lead Management |
| Manage product catalog and coverage rules | Product Management (BBOM), Contract Administration |
| Process claim intake | Claims Management, CRM System |
| Adjudicate claims and authorize fulfillment | Claims Management, Service Dispatch |
| Execute repair work orders | Servicer Management System |
| Process reimbursements and payments | Finance & Reimbursement |

## Implementation Notes

### Positions
- Actor positions span 10-70 on horizontal axis
- User need positions will be calculated to align with their primary actors
- Multiple contexts per need will fan out connections in Strategic View

### Direct Usage Only
All need-context connections represent **direct usage** by actors:
- Sales rep interacts with POS system (not downstream Contract Administration)
- Service technician interacts with Servicer Management System (not upstream Service Dispatch)
- Each connection represents actual UI/system touchpoint

### Simplified Needs
Each actor has exactly one primary user need that captures their core job function. This keeps the Strategic View clean and focuses on essential value delivery rather than enumerating every possible task.
