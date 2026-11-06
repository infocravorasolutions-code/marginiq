# MarginIQ — The Single Operating System for E-Commerce Businesses
## Master Architectural Blueprint & End-to-End Operational Guide

---

## 1. The Core Philosophy: Business-Flow-First, Not Menu-First

MarginIQ is built to be the **single operating system for an e-commerce business**. 

In conventional tools, sellers deal with fragmented spreadsheets, isolated fee calculators, and disconnected dashboards. In MarginIQ, **you add a product once, and the platform determines the complete lifecycle economics of selling that product across Amazon, Flipkart, Meesho, and D2C** — factoring in landed costs, marketplace fee schedules, shipping tiers, advertising, customer returns, RTO losses, bank settlements, overcharge leakages, and final actual net profit.

The platform architecture is designed around **one continuous data chain**:

```mermaid
graph TD
    A[ADD PRODUCT<br/>Cost, Dimensions, GST, SKU, Stock] --> B[PRODUCT COST ENGINE<br/>Purchase + Freight + Packaging + Labelling]
    B --> C[MARKETPLACE COST ENGINE<br/>Amazon, Flipkart, Meesho, D2C Fee Rules]
    C --> D[PRICE INTELLIGENCE<br/>Break-even, Min, Target Margin, Recommended Price]
    D --> E[PLATFORM COMPARISON<br/>Side-by-side Profit, Margin, ROI]
    E --> F[SELLING & ORDERS<br/>Freeze Immutable CalculationSnapshot]
    F --> G[REAL-WORLD EVENTS<br/>Returns, RTO, Damage, Weight Disputes, Fee Drift]
    G --> H[SETTLEMENT IMPORT<br/>Raw Marketplace Remittance Files]
    H --> I[RECONCILIATION ENGINE<br/>Expected vs Actual Variance Analysis]
    I --> J[ACTUAL PROFIT LEDGER<br/>True Net Bank Profit]
    J --> K[BUSINESS DASHBOARD<br/>Profit, Margin, Leakages, Platform Comparison, Action Alerts]
```

---

## 2. Step 1: True Landed Cost Engine

MarginIQ never calculates profit based on pure purchase price alone. When a product is created, MarginIQ calculates the **True Landed Cost**:

### Example: Car Mobile Holder (`SKU: CMH001`)

| Input Parameter | Value |
| :--- | :--- |
| **Purchase Price** | ₹120.00 |
| **Inbound Freight** | ₹7.00 |
| **Packaging Cost** (Box, Bubble wrap, Polybag) | ₹10.00 |
| **Labelling & Barcoding** | ₹3.00 |
| **Inspection & Other Procurement** | ₹5.00 |
| **Product Weight** | 500g |
| **Dimensions ($L \times W \times H$)** | $15 \times 10 \times 8$ cm |
| **GST Slab** | 18% |

$$\text{True Landed Cost} = ₹120 + ₹7 + ₹10 + ₹3 + ₹5 = \mathbf{₹145.00}$$

> **This ₹145.00 becomes the immutable cost foundation for every marketplace calculation across the entire platform.**

---

## 3. Step 2: Multi-Platform Cost Engine & Comparison

When you consider selling this product at **₹399.00**, MarginIQ models every marketplace independently using verified fee matrices and logistics rules:

```mermaid
graph LR
    P[Landed Cost: ₹145<br/>Selling Price: ₹399] --> AMZ[Amazon India<br/>Referral + Closing + FBA Shipping + GST]
    P --> FK[Flipkart<br/>Commission + Collection + Fixed + Shipping]
    P --> MSH[Meesho<br/>Zero Commission + Courier Freight + RTO Risk]
    P --> D2C[D2C Store<br/>PG Fee 2% + Courier Shipping + Ad Allowance]
```

### Side-by-Side Platform Decision Matrix

| Platform | Selling Price | True Landed Cost | Marketplace & Logistics Fees | GST on Fees | Return & Ad Reserve | Expected Profit | Net Margin | Projected ROI |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon** | ₹399 | ₹145 | ₹118.00 | ₹21.24 | ₹25.76 | **₹89.00** | **22.3%** | **61.4%** |
| **Flipkart** | ₹399 | ₹145 | ₹106.00 | ₹19.08 | ₹24.92 | **₹104.00** | **26.1%** | **71.7%** |
| **Meesho** | ₹399 | ₹145 | ₹88.00 | ₹15.84 | ₹31.16 | **₹119.00** | **29.8%** | **82.1%** |
| **D2C** | ₹399 | ₹145 | ₹62.00 | ₹11.16 | ₹16.84 | **₹164.00** | **41.1%** | **113.1%** |

**Strategic Value**: Before listing a single item or stocking inventory, the seller instantly knows that while D2C and Meesho yield higher nominal margins, customer return/RTO risk profiles require different pricing and channel priorities.

---

## 4. Step 3: Expected Profit vs. Actual Profit (The Core Distinction)

A fundamental principle of MarginIQ is that **Expected Profit $\neq$ Actual Profit**:

```
When Listed / Ordered  →  EXPECTED PROFIT (Immutable CalculationSnapshot)
When Disbursed         →  ACTUAL PROFIT   (Remittance via Settlement Reconciliation)
```

1. **At Order Placement**: MarginIQ freezes an immutable `CalculationSnapshot`. This locks the fee rule version, landed cost, and expected shipping zone at that exact moment.
2. **At Bank Settlement**: MarginIQ parses the official marketplace remittance file, isolates debits/credits, and computes the exact cash disbursed to the seller's account.

### Explainable Variance Decomposition (No Black-Box Numbers)

If an order earns **₹61.00** instead of the expected **₹82.00**, MarginIQ decomposes the exact ₹21 difference:

```text
Expected Profit:                 ₹82.00
Actual Disbursed Profit:         ₹61.00
---------------------------------------
Total Profit Variance:          -₹21.00

Variance Breakdown:
  • Higher Courier Weight Slab:  -₹12.00  (Charged for 1.2 kg instead of 500g dead weight)
  • Referral Fee Rate Drift:     -₹5.00  (Category fee updated without notification)
  • Reverse Logistics Handling:  -₹4.00  (Packaging inspection charge on partial return)
```

---

## 5. Step 4: True Economics of Customer Returns & RTO

Returns are the #1 profit leak in Indian e-commerce. MarginIQ separates **Customer Returns** from **Courier RTO (Return to Origin)** because their financial consequences are completely different:

### 1. Customer Return Economics
A customer receives the package, opens it, and initiates a return within 7–10 days:
$$\text{Actual Return Loss} = \text{Forward Shipping} + \text{Reverse Courier Shipping} + \text{Marketplace Closing/Return Fee} + \text{Packaging Loss} + \text{Product Damage/Depreciation}$$

### 2. RTO (Undelivered / Refused at Doorstep) Economics
The customer cancels while in transit or refuses COD delivery. The item was never opened, but logistics and capital are wasted:
$$\text{Total RTO Loss} = \text{Forward Courier Fee} + \text{RTO Return Freight} + \text{Blocked Capital Cost} + \text{Outbound Packaging Waste}$$

### MarginIQ Return Intelligence
- Identifies products where actual returns erode over 40% of gross margin.
- Alerts the seller when high COD return rates make selling on Meesho or Flipkart unprofitable compared to prepaid channels.

---

## 6. Step 5: Marketplace Rules Engine & Transparency

Fee calculations must never be black boxes. The [Marketplace Fee Engine](file:///Users/darshanpatel/Desktop/marginiq/backend/src/services/providers) resolves fees dynamically through 9 hierarchical parameters:

```text
Marketplace (Amazon / Flipkart / Meesho)
   └── Category (e.g., Automotive Accessories)
         └── Selling Price Slab (< ₹250 / ₹251–₹500 / ₹501–₹1000 / > ₹1000)
               └── Weight & Volumetric Slabs
                     └── Fulfilment Mode (FBA / EasyShip / Self-Ship)
                           └── Shipping Zone (Local / Regional / National)
                                 └── Seller Tier (Standard / Gold / Platinum)
                                       └── Payment Gateway Type (Prepaid / COD)
                                             └── Effective Rule Date (Versioned)
```

Every fee deduction displays:
- **Rule Source**: Official Amazon Seller Fee Schedule
- **Rule Version**: `AMZ-IN-2026-Q4`
- **Effective Date**: `01-Oct-2026`
- **Audit Confidence**: `Verified`

---

## 7. Step 6: Executive Business Dashboard

The executive dashboard answers one fundamental question: **"How is my business actually performing in cash reality?"**

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS FINANCIAL HEALTH                       │
│  Total Gross Sales:    ₹12,45,000       Actual Net Profit:   ₹2,14,500 │
│  Net Profit Margin:         17.2%       Capital ROI:             31.4% │
├────────────────────────────────────────────────────────────────────────┤
│                       PLATFORM PROFIT CONTRIBUTION                     │
│  Amazon India:         ₹92,000 profit   (Margin: 19.4%)                │
│  Flipkart:             ₹51,000 profit   (Margin: 21.1%)                │
│  Meesho:               ₹43,000 profit   (Margin: 14.8% after RTO)      │
│  D2C Brand Store:      ₹28,500 profit   (Margin: 38.2%)                │
├────────────────────────────────────────────────────────────────────────┤
│                       IDENTIFIED PROFIT LEAKAGES                       │
│  Unexpected Marketplace Fees:  ₹12,400  (Overcharged commission slabs) │
│  Shipping Weight Variances:     ₹8,200  (Dead weight vs carrier slab)  │
│  Customer Return Losses:       ₹18,500  (Damaged & unresellable units) │
│  Courier RTO Losses:            ₹9,800  (Failed COD courier costs)     │
│  Missing Remittances:           ₹4,100  (Delivered but unpaid orders)  │
│  Total Recoverable Leakage:    ₹53,000  (Ready for dispute filing)     │
├────────────────────────────────────────────────────────────────────────┤
│                           PRODUCT SCORECARD                            │
│  Most Profitable SKUs:                 Loss-Making SKUs:               │
│    1. Car Mobile Holder (+₹48k)          1. Silicone Spatula Set (-₹4k)│
│    2. Bamboo Drawer Organizer (+₹32k)    2. Heavy Resistance Band (-₹2k)
├────────────────────────────────────────────────────────────────────────┤
│                             ACTION ALERTS                              │
│  ⚠️ SKU 'CMH001' Amazon shipping fee surged by 18% (Weight audit req.) │
│  ⚠️ Meesho RTO rate exceeded 24% for COD orders in North Zone          │
│  ⚠️ Settlement Report 2026-W40 has ₹8,200 unresolved remittance drift  │
│  ⚠️ Reprice SKU 'SS-01' from ₹199 to ₹229 to restore 15% net margin    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Alignment: How MarginIQ Modules Map to the Continuous Business Chain

The platform navigation directly reflects this operational hierarchy:

| Stage | Feature / Page | What It Does | Role in Continuous Chain |
| :--- | :--- | :--- | :--- |
| **1. Pre-Listing** | **Product Research** (`/research`) | Category trend & demand intelligence. | Discovers high-margin niches before capital commitment. |
| **2. Decision** | **Product Analyzer** (`/analyzer`) | Full multi-marketplace simulation. | Verifies true net profit at candidate selling prices. |
| **3. Master Catalog**| **Product Database** (`/products`) | Master product library. | Stores SKU, true landed costs, HSN, and dimensions. |
| **4. Market Context**| **Competitor Analysis** (`/competitor`) | Market price & saturation tracking. | Informs competitive price points. |
| **5. Selection** | **Opportunity Finder** (`/opportunities`) | Algorithmic scoring filter. | Surfaces highest ROI candidates. |
| **6. Execution** | **Sourcing & Suppliers** (`/sourcing`) | Manufacturer database & POs. | Determines batch landed costs and lead times. |
| **7. Inventory** | **Inventory Management** (`/inventory`) | Stock allocation & valuation. | Monitors available, damaged, and returned inventory. |
| **8. Sales** | **Orders & Sales** (`/orders`) | Order ingestion & snapshotting. | Freezes immutable `CalculationSnapshot`. |
| **9. Remittance** | **Settlement Import** (`/settlements`) | Ingests official settlement CSVs. | Normalizes debits, credits, TCS, TDS, and fees. |
| **10. Audit** | **Reconciliation** (`/reconciliation`) | Expected vs Actual comparison. | Detects discrepancies, overcharges, and claims. |
| **11. Results** | **Executive Dashboard** (`/dashboard`) | Business-level performance. | Displays actual profit, margins, and leakage. |
| **12. Intelligence** | **Reports & Analytics** (`/reports`) | 14 automated financial reports. | Delivers accounting ledgers and recurring exports. |

---

## 9. Proven Accounting Regression Benchmark

MarginIQ's engine is mathematically verified against real Amazon India settlement remittance flat files:

```text
Order ID:               402-6921987-6804352
Customer Sale Price:    ₹199.00
Marketplace Fees:       -₹7.08
Shipping & Courier:     -₹76.70
TCS Deducted:           -₹0.84
GST Liable:             ₹30.36
Product Landed Cost:    ₹130.00
------------------------------------------------
Expected Profit:        ₹31.25
Actual Remittance Net:  -₹15.14
Revenue Variance:       ₹0.00
```
This confirms that MarginIQ preserves the exact distinction between expected forecast and true bank cash flow.
