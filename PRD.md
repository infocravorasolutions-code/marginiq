   # MARGINIQ
   ## E-Commerce Inventory, Marketplace Pricing & True Profitability Intelligence Platform

   ---

   # 1. PROJECT MISSION

   Build and evolve **MarginIQ**, a production-ready SaaS platform for Indian e-commerce sellers.

   MarginIQ's primary purpose is:

   > **Help an e-commerce seller know the REAL amount of money they will make from every product they sell.**

   The system must connect:

   ```text
   Inventory
      ↓
   Purchase Cost
      ↓
   Landed Cost
      ↓
   Marketplace
      ↓
   Listing Price
      ↓
   Marketplace Fees
      ↓
   Shipping / Fulfilment
      ↓
   Taxes / Applicable Charges
      ↓
   Advertising
      ↓
   Customer Returns
      ↓
   RTO
      ↓
   Damaged / Lost Products
      ↓
   Other Operational Costs
      ↓
   TRUE PROFIT
   ```

   The platform must answer:

   > **"If I buy this product for ₹X and sell it on Amazon / Flipkart / Meesho for ₹Y, after EVERYTHING, how much money do I actually make?"**

   MarginIQ must also answer the reverse question:

   > **"If I want ₹X profit or X% margin, what should my selling/listing price be?"**

   ---

   # 2. IMPORTANT PRODUCT PRINCIPLE

   Do NOT build MarginIQ as a basic profit calculator.

   Do NOT use:

   ```text
   Selling Price - Purchase Cost = Profit
   ```

   That is incorrect for real marketplace selling.

   Instead, MarginIQ must calculate:

   ```text
   Selling Price
   - Product Cost
   - Landed Cost
   - Marketplace Fees
   - Fulfilment Fees
   - Shipping
   - Packaging
   - Advertising
   - Return Reserve
   - RTO Reserve
   - Damage/Loss Reserve
   - Other Operational Costs
   = Expected True Profit
   ```

   The platform must distinguish between:

   ### Gross Revenue

   ### Marketplace Settlement

   ### Contribution Profit

   ### Expected Net Profit

   ### Net Margin

   ### ROI

   These must never be mixed together.

   ---

   # 3. EXISTING TECHNOLOGY STACK

   The existing project already uses:

   ## Frontend

   - React
   - TypeScript
   - React Router DOM
   - Tailwind CSS
   - Lucide React
   - Context API

   ## Backend

   - Node.js
   - Express.js
   - TypeScript
   - MongoDB
   - Mongoose
   - JWT
   - bcrypt

   Do NOT unnecessarily replace the existing stack.

   Build on the existing project.

   Preserve existing working functionality unless modification is required for the new architecture.

   ---

   # 4. CURRENT APPLICATION MODULES

   The application already contains or is intended to contain:

   ```text
   Dashboard
   Product Research
   Product Analyzer
   Product Database
   Competitor Analysis
   Opportunity Finder
   Saved Products
   Watchlist
   Sourcing & Suppliers
   ROI Calculator
   Reports
   Settings
   Admin
   Authentication
   ```

   Keep these modules, but reorganize their importance around the new core business workflow.

   ---

   # 5. NEW PRIMARY PRODUCT STRUCTURE

   The main navigation should become:

   ```text
   Dashboard

   Inventory
   ├── Products
   ├── Stock
   ├── Purchases
   ├── Suppliers
   └── Stock Movements

   Marketplace
   ├── Amazon
   ├── Flipkart
   ├── Meesho
   ├── Marketplace Profiles
   └── Fee Rules

   Pricing & Profit
   ├── Profit Calculator
   ├── Price Calculator
   ├── Marketplace Comparison
   └── Scenario Analysis

   Research
   ├── Product Research
   ├── Product Analyzer
   ├── Competitor Analysis
   └── Opportunity Finder

   Operations
   ├── Orders
   ├── Returns
   ├── RTO
   ├── Damages
   └── Expenses

   Workspace
   ├── Saved Products
   ├── Watchlist
   ├── Suppliers
   └── Reports

   Admin
   ├── Users
   ├── Marketplaces
   ├── Fee Rules
   ├── Scoring
   └── System Settings
   ```

   ---

   # 6. CORE USER WORKFLOW

   The primary workflow should be:

   ```text
   Add Product
         ↓
   Enter Purchase Cost
         ↓
   Enter Packaging / Landed Costs
         ↓
   Enter Stock
         ↓
   Select Marketplace
         ↓
   Select Category
         ↓
   Enter Product Weight
         ↓
   Enter Dimensions
         ↓
   Select Fulfilment Method
         ↓
   Enter Target Selling Price
         ↓
   MarginIQ calculates every cost
         ↓
   Calculate True Profit
         ↓
   Calculate Margin
         ↓
   Calculate ROI
         ↓
   Calculate Break-even
         ↓
   Recommend Selling Price
         ↓
   Compare Marketplaces
         ↓
   DECISION
   ```

   ---

   # 7. INVENTORY MANAGEMENT

   Inventory is now a first-class module.

   Users must be able to create products.

   Product fields:

   ```text
   Product Name
   SKU
   Barcode
   Category
   Subcategory
   Brand
   Supplier
   Product Image
   Description

   Purchase Price
   Purchase Quantity

   Packaging Cost
   Label Cost
   Inbound Shipping
   Inspection Cost
   Other Procurement Cost

   Weight
   Length
   Width
   Height

   GST Rate
   HSN Code

   Current Stock
   Reserved Stock
   Available Stock
   Damaged Stock
   Returned Stock
   ```

   ---

   # 8. LANDED COST

   Do not assume purchase price equals actual product cost.

   Calculate:

   ```text
   Landed Cost =
   Purchase Cost
   + Packaging
   + Labelling
   + Inbound Shipping
   + Inspection
   + Import Cost
   + Other Procurement Cost
   ```

   Example:

   ```text
   Purchase Cost          ₹80
   Packaging               ₹8
   Label                   ₹2
   Transport               ₹5
   Inspection              ₹2
   ---------------------------
   Landed Cost            ₹97
   ```

   MarginIQ must use ₹97 for profitability calculations instead of ₹80.

   ---

   # 9. INVENTORY BATCHES

   Support multiple purchase batches.

   Example:

   ```text
   SKU: CAR-BRUSH-001

   Batch A
   Quantity: 100
   Cost: ₹80

   Batch B
   Quantity: 200
   Cost: ₹92
   ```

   Allow costing methods:

   ```text
   FIFO
   Weighted Average
   Manual
   ```

   Default:

   **Weighted Average Cost**

   ---

   # 10. STOCK MOVEMENTS

   Track:

   ```text
   Purchase
   Sale
   Return
   Damage
   Loss
   Adjustment
   Transfer
   Reserved
   Released
   ```

   Every movement must be auditable.

   Example:

   ```text
   Opening Stock       100
   Purchase            +50
   Sold                -20
   Return               +2
   Damaged              -1
   Current              131
   ```

   ---

   # 11. SUPPLIER MANAGEMENT

   Supplier fields:

   ```text
   Supplier Name
   Company
   Phone
   Email
   Address
   GSTIN
   Payment Terms
   MOQ
   Lead Time
   Product Categories
   Notes
   ```

   Track supplier pricing history.

   ---

   # 12. MARKETPLACE ARCHITECTURE

   Do NOT hard-code marketplace calculations into React components.

   Create a backend **Marketplace Rules Engine**.

   Each marketplace must be represented as a configurable provider.

   Example:

   ```typescript
   MarketplaceProvider
   ```

   Implement:

   ```text
   AmazonProvider
   FlipkartProvider
   MeeshoProvider
   ```

   Future:

   ```text
   ShopifyProvider
   MyntraProvider
   AjioProvider
   SnapdealProvider
   ```

   ---

   # 13. MARKETPLACE RULE ENGINE

   Every marketplace must have configurable:

   ```text
   Commission / Referral Fee
   Fixed / Closing Fee
   Shipping Fee
   Weight Handling Fee
   Collection Fee
   Fulfilment Fee
   Storage Fee
   Pick & Pack Fee
   Return Shipping Fee
   RTO Fee
   Cancellation Fee
   Other Platform Fee
   Tax on Fees
   ```

   Rules must support:

   ```text
   Marketplace
   Category
   Subcategory
   Selling Price Range
   Weight Range
   Fulfilment Type
   Zone
   Payment Mode
   Seller Tier
   Effective From
   Effective Until
   ```

   ---

   # 14. VERSIONED FEE RULES

   This is CRITICAL.

   Marketplace fees change.

   Never overwrite old fee rules.

   Example:

   ```text
   Amazon Fee Rule
   Valid:
   01-01-2026 → 06-09-2026

   New Rule:
   07-09-2026 → Current
   ```

   A historical calculation must continue using the correct fee version.

   Every fee rule must have:

   ```text
   effectiveFrom
   effectiveUntil
   createdAt
   updatedAt
   source
   ```

   ---

   # 15. AMAZON ENGINE

   Support:

   ```text
   Referral Fee
   Closing Fee
   Weight Handling Fee
   Shipping
   Fulfilment
   Other Applicable Fees
   ```

   Amazon's official seller documentation confirms that fees depend on factors such as product category, price, fulfilment choice, weight and dimensions.

   Support fulfilment:

   ```text
   FBA
   Easy Ship
   Self Ship
   Seller Flex
   ```

   The engine must allow different fee rules per fulfilment model.

   ---

   # 16. FLIPKART ENGINE

   Support:

   ```text
   Commission Fee
   Fixed Fee
   Collection Fee
   Shipping Fee
   Fulfilment Fee
   Other Applicable Charges
   ```

   Flipkart's seller documentation states that fees vary based on category, shipping method and selling price, and its shipping calculation considers actual or volumetric weight and geography.

   Support:

   ```text
   FBF
   NFBF
   ```

   Support shipping zones:

   ```text
   Local
   Zonal
   National
   ```

   Support:

   ```text
   Actual Weight
   Volumetric Weight
   ```

   Volumetric weight:

   ```text
   Length × Width × Height / 5000
   ```

   Use the marketplace's current configurable rule rather than permanently hard-coding this value.

   ---

   # 17. MEESHO ENGINE

   Do NOT assume Meesho works like Amazon.

   Meesho's seller model does not charge sellers a commission, but seller costs can include fulfilment, return pickup, advertisements and other services.

   Therefore support:

   ```text
   Commission = configurable, default 0 where applicable
   Forward Shipping
   Return Shipping
   Fulfilment
   Advertising
   Other Services
   Applicable Taxes
   ```

   Do not display:

   > "Meesho is always free."

   Instead display:

   > "No commission under the applicable Meesho model; other service and logistics costs may apply."

   ---

   # 18. SHIPPING ENGINE

   Shipping must be calculated independently from marketplace commission.

   Inputs:

   ```text
   Actual Weight
   Length
   Width
   Height
   Origin
   Destination
   Zone
   Fulfilment Method
   Marketplace
   ```

   Calculate:

   ```text
   Volumetric Weight
   Chargeable Weight
   Shipping Slab
   Shipping Cost
   ```

   General calculation:

   ```text
   Chargeable Weight =
   MAX(Actual Weight, Volumetric Weight)
   ```

   But each marketplace must be allowed to override the volumetric divisor and weight rules.

   ---

   # 19. PACKAGING COST

   Allow:

   ```text
   Box
   Polybag
   Tape
   Bubble Wrap
   Label
   Printing
   Other Packaging
   ```

   Calculate:

   ```text
   Total Packaging Cost
   ```

   Packaging should be included in the true cost calculation.

   ---

   # 20. GST / TAX ENGINE

   Do not simply subtract GST from selling price without considering tax treatment.

   The system must distinguish:

   ```text
   Product GST
   GST collected
   GST included in selling price
   GST on marketplace fees
   Input Tax Credit
   Output GST
   TCS
   TDS
   ```

   Allow user configuration:

   ```text
   GST Registered
   GST Unregistered
   GST Rate
   Input Tax Credit Available
   ```

   The profitability engine should separately show:

   ```text
   Accounting / Tax View
   Cash Profit View
   ```

   Do not treat TCS/TDS automatically as an operating expense.

   They are generally settlement/tax-credit items and must be shown separately from true business cost unless the user explicitly configures otherwise.

   ---

   # 21. PAYMENT / COLLECTION FEES

   Support:

   ```text
   COD
   Prepaid
   UPI
   Card
   Wallet
   Other
   ```

   Marketplace-specific collection rules must be configurable.

   For example, Flipkart currently documents collection fees that differ by payment mode and selling-price range.

   ---

   # 22. ADVERTISING COST

   Users must be able to enter:

   ```text
   Advertising %
   or
   Advertising ₹ / Order
   ```

   Support:

   ```text
   Amazon Ads
   Flipkart Ads
   Meesho Ads
   External Ads
   Instagram
   Google
   Influencer
   Other
   ```

   Example:

   ```text
   Selling Price = ₹499
   Ad Cost = 8%

   Advertising Cost = ₹39.92
   ```

   ---

   # 23. DISCOUNT ENGINE

   Support:

   ```text
   Seller Discount
   Coupon
   Marketplace Discount
   Promotional Discount
   Bundle Discount
   ```

   Distinguish:

   ```text
   Customer-facing discount
   Seller-funded discount
   Marketplace-funded discount
   ```

   Only seller-funded discounts should reduce the seller's effective revenue.

   ---

   # 24. RETURN ENGINE

   This is one of the most important MarginIQ modules.

   Users should configure expected:

   ```text
   Customer Return Rate
   RTO Rate
   Cancellation Rate
   Damage Rate
   Defect Rate
   Lost Rate
   ```

   Example:

   ```text
   100 orders

   Return Rate = 5%
   RTO = 2%
   Damage = 0.5%
   ```

   MarginIQ calculates expected cost.

   ---

   # 25. RETURN COST MODEL

   For a returned order, consider:

   ```text
   Original Shipping
   Return Shipping
   Marketplace Return Fee
   Product Damage
   Repackaging
   Resale Loss
   Inventory Downtime
   Refund
   ```

   Not every return causes the same loss.

   Therefore support return scenarios:

   ```text
   Good Return
   Damaged Return
   Used Return
   Unusable Return
   Lost Return
   ```

   ---

   # 26. RETURN RECOVERY VALUE

   For each returned product:

   ```text
   Recovery Value %
   ```

   Example:

   ```text
   Product Value = ₹300

   Good Return:
   Recovery = 95%

   Damaged:
   Recovery = 50%

   Unusable:
   Recovery = 0%
   ```

   Expected recovery should reduce expected return loss.

   ---

   # 27. RTO ENGINE

   RTO = Return To Origin.

   Calculate:

   ```text
   RTO Probability
   Forward Shipping Cost
   Reverse Shipping Cost
   Packaging Loss
   Handling
   Inventory Re-entry
   ```

   Example:

   ```text
   RTO Rate = 3%

   Expected RTO Cost
   = RTO Rate × Average RTO Loss
   ```

   ---

   # 28. DAMAGE ENGINE

   Support:

   ```text
   Customer Damaged
   Courier Damaged
   Warehouse Damaged
   Manufacturing Defect
   Lost
   Missing
   ```

   Calculate expected loss.

   Allow user to configure:

   ```text
   Damage Rate
   Average Damage Loss
   Recovery %
   ```

   ---

   # 29. EXPECTED COST MODEL

   MarginIQ must support two views.

   ## Actual View

   Based on real completed orders.

   ## Expected View

   Based on assumptions.

   Example:

   ```text
   Expected Return Loss
   = Return Rate × Average Return Cost

   Expected Damage Loss
   = Damage Rate × Average Damage Cost

   Expected RTO Loss
   = RTO Rate × Average RTO Cost
   ```

   ---

   # 30. TRUE PROFIT FORMULA

   Primary formula:

   ```text
   Net Revenue
   -
   Landed Product Cost
   -
   Marketplace Fees
   -
   Shipping
   -
   Packaging
   -
   Advertising
   -
   Expected Return Loss
   -
   Expected RTO Loss
   -
   Expected Damage/Loss
   -
   Other Operating Cost
   =
   Expected True Profit
   ```

   ---

   # 31. PROFIT PER ORDER

   Display prominently:

   ```text
   Selling Price
   ₹499

   Expected True Cost
   ₹348

   Expected True Profit
   ₹151

   True Margin
   30.26%
   ```

   ---

   # 32. TRUE MARGIN

   Formula:

   ```text
   True Margin =
   Expected True Profit / Effective Selling Revenue × 100
   ```

   Clearly distinguish this from gross margin.

   ---

   # 33. ROI

   Calculate:

   ```text
   ROI =
   Profit / Invested Capital × 100
   ```

   Investment can include:

   ```text
   Inventory
   Packaging
   Branding
   Initial Ads
   Setup Costs
   ```

   ---

   # 34. BREAK-EVEN PRICE

   Calculate the minimum price at which:

   ```text
   True Profit = ₹0
   ```

   Display:

   > **Break-even price: ₹XXX**

   ---

   # 35. TARGET PROFIT PRICE

   Allow:

   ```text
   Target Profit: ₹100
   ```

   or:

   ```text
   Target Margin: 30%
   ```

   MarginIQ solves for:

   > **Recommended Selling Price**

   ---

   # 36. PRICE RANGE ANALYSIS

   Show:

   ```text
   ₹249
   ₹299
   ₹349
   ₹399
   ₹449
   ₹499
   ₹549
   ₹599
   ```

   For every price:

   ```text
   Marketplace Fees
   True Cost
   Profit
   Margin
   ```

   Create a graph:

   ```text
   Selling Price → Profit
   ```

   This allows users to find the optimal price.

   ---

   # 37. MARKETPLACE COMPARISON

   For one product:

   ```text
                  Amazon   Flipkart   Meesho

   Selling Price    ₹499      ₹499       ₹499

   Commission       ₹XX       ₹XX        ₹0

   Fixed Fee         ₹XX       ₹XX        ₹XX

   Shipping          ₹XX       ₹XX        ₹XX

   Return Reserve    ₹XX       ₹XX        ₹XX

   Ad Cost            ₹XX       ₹XX        ₹XX

   True Cost         ₹XXX      ₹XXX       ₹XXX

   Profit             ₹XX       ₹XX        ₹XX

   Margin             XX%       XX%        XX%
   ```

   Highlight:

   ### Best Marketplace

   based on:

   ```text
   Profit
   Margin
   Risk
   ```

   ---

   # 38. MARKETPLACE DECISION

   Do not always select the marketplace with the highest raw profit.

   Consider:

   ```text
   Profit
   Margin
   Return Risk
   Competition
   Demand
   Inventory Turnover
   ```

   Example:

   > Amazon gives ₹155 profit but high return risk.

   > Meesho gives ₹145 profit but lower operational complexity.

   Show:

   ### Recommended Channel

   ---

   # 39. INVENTORY + MARKETPLACE CONNECTION

   Every inventory product should have:

   ```text
   Marketplace Listing
   ```

   Example:

   ```text
   SKU:
   CAR-BRUSH-001

   Inventory Cost:
   ₹97

   Amazon:
   ₹499

   Flipkart:
   ₹479

   Meesho:
   ₹449
   ```

   The same inventory product can have multiple marketplace listings.

   ---

   # 40. MARKETPLACE LISTING PROFILE

   For each product:

   ```text
   Marketplace
   Listing SKU
   Listing Price
   MRP
   Discount
   Category
   Fulfilment
   Weight
   Dimensions
   GST
   Status
   ```

   ---

   # 41. PRICE RECOMMENDATION

   MarginIQ should calculate:

   ### Minimum Price

   Price where profit = ₹0.

   ### Safe Price

   Price with target margin.

   ### Recommended Price

   Price balancing:

   ```text
   Profit
   Market Price
   Competition
   Target Margin
   ```

   ### Aggressive Price

   Lower price to increase competitiveness.

   ---

   # 42. COMPETITOR PRICE

   Product Analyzer should show:

   ```text
   Lowest Competitor
   Average Competitor
   Highest Competitor
   Your Price
   ```

   Then:

   ```text
   Your Price vs Market
   ```

   ---

   # 43. INVENTORY PROFIT FORECAST

   If:

   ```text
   Stock = 500 units
   Expected Profit = ₹120/unit
   ```

   Show:

   ```text
   Potential Inventory Profit
   = ₹60,000
   ```

   But also calculate expected return/damage impact.

   ---

   # 44. STOCK PROFITABILITY

   Dashboard should show:

   ```text
   Inventory Value
   Potential Revenue
   Potential Profit
   Dead Stock
   Fast Moving Stock
   Low Margin Stock
   ```

   Example:

   ```text
   Inventory Value        ₹4,50,000
   Potential Revenue      ₹8,20,000
   Potential Profit       ₹1,75,000
   ```

   ---

   # 45. DEAD STOCK

   Identify products:

   ```text
   Low Sales
   Low Margin
   High Stock
   ```

   Recommendation:

   ```text
   Discount
   Bundle
   Liquidate
   Stop Reordering
   ```

   ---

   # 46. LOW-MARGIN ALERT

   If:

   ```text
   True Margin < User Target
   ```

   show:

   > ⚠️ This product is below your target margin.

   ---

   # 47. LOSS ALERT

   If:

   ```text
   True Profit < 0
   ```

   show:

   > 🔴 LOSS — Do not list at this price.

   ---

   # 48. RETURN-RISK ALERT

   If expected return losses consume significant profit:

   ```text
   Profit before returns = ₹180
   Profit after return reserve = ₹105
   ```

   show:

   > ⚠️ Returns are reducing expected profitability by 41.7%.

   ---

   # 49. PRODUCT RESEARCH

   Keep Product Research as an intelligence module.

   Search:

   ```text
   Car accessories
   Kitchen products
   Baby products
   Home products
   Cleaning
   Storage
   ```

   Display:

   ```text
   Market Price
   Estimated Cost
   Estimated Margin
   Competition
   Return Risk
   Opportunity Score
   ```

   ---

   # 50. PRODUCT OPPORTUNITY SCORE

   Create:

   ```text
   Profitability       25%
   Demand              20%
   Competition         15%
   Return Risk         15%
   Shipping Efficiency 10%
   Brandability         5%
   Seasonality          5%
   Complexity            5%
   ```

   Score:

   ```text
   90-100 Exceptional
   80-89  Strong
   70-79  Good
   60-69  Moderate
   <60    Weak
   ```

   ---

   # 51. OPPORTUNITY FINDER

   User enters:

   ```text
   Maximum Investment
   Target Margin
   Maximum Selling Price
   Maximum Weight
   Preferred Category
   Maximum Return Risk
   Maximum Competition
   ```

   MarginIQ returns:

   ```text
   Product
   Landed Cost
   Expected Selling Price
   Expected True Profit
   True Margin
   Return Risk
   Opportunity Score
   ```

   ---

   # 52. SCENARIO ANALYSIS

   Users should be able to change:

   ```text
   Selling Price
   Product Cost
   Shipping
   Advertising
   Return Rate
   RTO Rate
   Damage Rate
   Monthly Orders
   ```

   and see results instantly.

   Example:

   ### Conservative

   ```text
   Return = 8%
   Ads = 12%
   ```

   ### Normal

   ```text
   Return = 5%
   Ads = 8%
   ```

   ### Optimistic

   ```text
   Return = 3%
   Ads = 5%
   ```

   Show:

   ```text
   Worst Case
   Expected Case
   Best Case
   ```

   ---

   # 53. SENSITIVITY ANALYSIS

   Show which factors hurt profit most.

   Example:

   ```text
   Return Rate +5%
   → Profit -₹18

   Ad Cost +5%
   → Profit -₹25

   Shipping +₹10
   → Profit -₹10

   Purchase Cost +₹10
   → Profit -₹10
   ```

   This tells the seller what actually matters.

   ---

   # 54. CASH FLOW VIEW

   Profit and cash flow are different.

   Track:

   ```text
   Inventory Purchase
   Marketplace Settlement
   Pending Settlement
   Returns Pending
   Refunds
   Fees
   Taxes
   ```

   Show:

   ### Cash Invested

   ### Cash Received

   ### Cash Pending

   ### Cash Locked in Inventory

   ---

   # 55. ORDER MANAGEMENT

   Allow users to import or manually add orders.

   Order fields:

   ```text
   Order ID
   Marketplace
   SKU
   Selling Price
   Discount
   Marketplace Fees
   Shipping
   Customer Payment
   Return Status
   RTO Status
   Damage Status
   Settlement Amount
   ```

   Actual orders should eventually replace estimated assumptions.

   ---

   # 56. ACTUAL VS ESTIMATED PROFIT

   This is a major feature.

   Before selling:

   ```text
   Estimated Profit = ₹145
   ```

   After actual settlement:

   ```text
   Actual Profit = ₹126
   ```

   Show:

   ```text
   Estimated       ₹145
   Actual          ₹126
   Difference      -₹19
   ```

   Then identify why:

   ```text
   Shipping +₹8
   Return +₹7
   Ads +₹4
   Other +₹0
   ```

   This makes MarginIQ progressively more accurate.

   ---

   # 57. SETTLEMENT IMPORT

   Future-ready architecture should allow importing:

   ```text
   Amazon Settlement
   Flipkart Settlement
   Meesho Settlement
   ```

   via:

   ```text
   CSV
   Excel
   API
   ```

   Then reconcile:

   ```text
   Order
   Marketplace Fees
   Refund
   Return
   Settlement
   Bank Amount
   ```

   ---

   # 58. RECONCILIATION

   Show:

   ```text
   Expected Settlement
   ₹38,500

   Actual Settlement
   ₹36,920

   Difference
   ₹1,580
   ```

   Break down the difference.

   ---

   # 59. EXPENSE MANAGEMENT

   Users can add:

   ```text
   Rent
   Warehouse
   Staff
   Packaging
   Software
   Ads
   Transportation
   Internet
   Other
   ```

   Classify:

   ```text
   Variable
   Fixed
   Product-specific
   Business-wide
   ```

   ---

   # 60. ALLOCATION OF FIXED COST

   Allow:

   ```text
   Monthly Fixed Expenses
   ₹50,000

   Monthly Orders
   1,000
   ```

   Allocated overhead:

   ```text
   ₹50/order
   ```

   Users can optionally include this in true net profit.

   Important:

   Show both:

   ```text
   Contribution Profit
   Net Profit after Overhead
   ```

   ---

   # 61. DASHBOARD

   Dashboard KPIs:

   ```text
   Inventory Value
   Potential Revenue
   Expected Profit
   Actual Profit
   Average Margin
   Total Orders
   Return Rate
   RTO Rate
   Dead Stock
   Low Margin Products
   ```

   ---

   # 62. PRODUCT PROFITABILITY TABLE

   Example:

   | Product | Cost | Price | Fees | Returns | True Profit | Margin |
   |---|---:|---:|---:|---:|---:|---:|
   | Car Brush | ₹97 | ₹499 | ₹210 | ₹18 | ₹174 | 34.9% |
   | Hook Kit | ₹55 | ₹299 | ₹130 | ₹10 | ₹104 | 34.8% |
   | Sink Strainer | ₹72 | ₹349 | ₹165 | ₹15 | ₹97 | 27.8% |

   ---

   # 63. PRODUCT HEALTH STATUS

   Each SKU should have:

   ```text
   🟢 Excellent
   🟢 Healthy
   🟡 Watch
   🟠 Low Margin
   🔴 Loss
   ```

   ---

   # 64. DATABASE MODELS

   Create or evolve the following:

   ```text
   User
   Organization
   Product
   ProductBatch
   InventoryMovement
   Supplier
   Purchase
   Marketplace
   MarketplaceCategory
   MarketplaceFeeRule
   MarketplaceListing
   ProductAnalysis
   ProfitCalculation
   ProfitScenario
   Order
   Return
   RTO
   Damage
   Expense
   SavedProduct
   Watchlist
   Competitor
   Report
   Subscription
   AuditLog
   ```

   ---

   # 65. IMPORTANT PROFIT CALCULATION MODEL

   Create a centralized backend service:

   ```text
   ProfitabilityEngine
   ```

   Never duplicate calculation logic across pages.

   Example:

   ```typescript
   calculateProfitability({
   product,
   marketplace,
   marketplaceListing,
   sellingPrice,
   fulfilmentMethod,
   destination,
   paymentMethod,
   advertisingCost,
   returnAssumptions,
   businessExpenses
   })
   ```

   Return:

   ```typescript
   {
   sellingPrice,
   effectiveRevenue,

   productCost,
   landedCost,

   marketplaceFees,
   referralFee,
   closingFee,
   collectionFee,
   shippingFee,
   fulfilmentFee,
   returnShippingFee,
   otherPlatformFees,
   taxesOnFees,

   packagingCost,
   advertisingCost,

   expectedReturnLoss,
   expectedRTOLoss,
   expectedDamageLoss,

   variableCost,
   contributionProfit,
   allocatedOverhead,
   netProfit,

   margin,
   roi,
   breakEvenPrice,

   confidence,
   warnings
   }
   ```

   ---

   # 66. CALCULATION TRACE

   Every calculation must be explainable.

   Provide:

   ### "How was this calculated?"

   Example:

   ```text
   Selling Price
   ₹499

   Referral Fee
   ₹59.88
   (12% × ₹499)

   Closing Fee
   ₹XX

   Shipping
   ₹54

   Packaging
   ₹10

   Return Reserve
   ₹12

   Advertising
   ₹25

   Product Landed Cost
   ₹97

   -----------------------

   Expected True Profit
   ₹XXX
   ```

   Users must be able to understand every rupee.

   ---

   # 67. DATA CONFIDENCE

   Every external/estimated value must show:

   ```text
   Verified
   Estimated
   User Provided
   Imported
   Calculated
   ```

   Example:

   ```text
   Marketplace Fee
   ✓ Verified — Fee Rule v2026.09

   Return Rate
   ~ Estimated

   Product Cost
   ✓ User Provided
   ```

   ---

   # 68. FEE DATA SOURCES

   Every marketplace fee rule must store:

   ```text
   Source Name
   Source URL
   Effective Date
   Last Verified Date
   Notes
   ```

   Never silently invent fee rates.

   If a fee cannot be verified:

   ```text
   Status = Estimated
   ```

   ---

   # 69. ADMIN FEE MANAGEMENT

   Admin interface:

   ```text
   Marketplace
   Category
   Fee Type
   Value
   Calculation Method
   Price Range
   Weight Range
   Fulfilment
   Zone
   Payment Method
   Effective From
   Effective Until
   Source
   Status
   ```

   Calculation methods:

   ```text
   Percentage
   Fixed
   Per Kg
   Per Order
   Per Unit
   Tiered
   Formula
   ```

   ---

   # 70. FORMULA ENGINE

   Fee rules should support formulas.

   Example:

   ```text
   fee = sellingPrice * percentage
   ```

   or:

   ```text
   fee = fixedFee
   ```

   or:

   ```text
   fee = baseRate + extraWeight * incrementalRate
   ```

   Do not implement every marketplace rule as custom hard-coded code.

   ---

   # 71. MARKETPLACE PROVIDER INTERFACE

   Example:

   ```typescript
   interface MarketplaceProvider {
   calculateFees(input): FeeBreakdown;

   calculateShipping(input): ShippingBreakdown;

   calculateReturns(input): ReturnCost;

   calculateSettlement(input): Settlement;

   getRecommendedPrice(input): PriceRecommendation;
   }
   ```

   ---

   # 72. ERROR HANDLING

   If a required fee rule is missing:

   DO NOT silently return zero.

   Show:

   > ⚠️ Fee data unavailable for this category/fulfilment combination.

   Allow:

   ```text
   Use Manual Estimate
   ```

   but clearly mark it as estimated.

   ---

   # 73. PRICING UI

   Create a dedicated page:

   # Pricing Simulator

   Inputs:

   ```text
   Product
   Marketplace
   Category
   Fulfilment
   Selling Price
   ```

   Then display:

   ```text
   Revenue
   Marketplace Fees
   Logistics
   Returns
   Ads
   Product Cost
   True Profit
   Margin
   ```

   And:

   ### "What should I sell this for?"

   Input:

   ```text
   Target Margin: 30%
   ```

   Output:

   ```text
   Recommended Price: ₹XXX
   ```

   ---

   # 74. MARKETPLACE SIDE-BY-SIDE

   Create a premium comparison view.

   ```text
   Amazon
   Profit: ₹151
   Margin: 30.2%

   Flipkart
   Profit: ₹143
   Margin: 28.6%

   Meesho
   Profit: ₹129
   Margin: 25.8%
   ```

   Recommendation:

   > **Amazon currently provides the strongest estimated profitability.**

   ---

   # 75. RETURN SIMULATOR

   Allow users to change:

   ```text
   Return Rate
   RTO Rate
   Damage Rate
   Recovery Rate
   ```

   Graph:

   ```text
   Profit vs Return Rate
   ```

   Example:

   ```text
   0% Return     ₹180 profit
   2% Return     ₹169
   5% Return     ₹151
   10% Return    ₹120
   15% Return     ₹89
   ```

   ---

   # 76. INVENTORY PROFIT SIMULATOR

   Example:

   ```text
   Stock = 1,000 units

   Expected Selling Price = ₹499
   Expected True Profit = ₹151

   Potential Profit =
   ₹1,51,000
   ```

   Then adjust for:

   ```text
   Expected returns
   Damage
   Unsold inventory
   Discount
   ```

   Show:

   ### Realistic Expected Profit

   ---

   # 77. AI / INTELLIGENCE LAYER

   Future-ready.

   AI should explain:

   > "This product looks profitable, but your margin is highly sensitive to returns."

   Or:

   > "Reducing packaging cost by ₹5 increases annual projected profit by ₹XX."

   AI should NOT invent marketplace fee information.

   AI explanations must use actual calculated values from the engine.

   ---

   # 78. ALERTS

   Examples:

   ```text
   Your margin dropped below 25%.

   Marketplace fee changed.

   Product cost increased.

   Competitor price dropped.

   Return rate increased.

   Inventory is becoming slow-moving.

   Product is now below break-even.

   Marketplace fee rule expired.
   ```

   ---

   # 79. REPORTS

   Generate:

   ```text
   Product Profitability Report
   Marketplace Comparison
   Inventory Profit Report
   Supplier Report
   Return Analysis
   Expense Report
   Actual vs Estimated Report
   ```

   Export:

   ```text
   Excel
   CSV
   PDF
   ```

   ---

   # 80. SECURITY

   Implement:

   ```text
   JWT
   bcrypt
   Role-based access
   Organization isolation
   API validation
   Rate limiting
   CORS
   Secure headers
   Audit logging
   Input sanitization
   ```

   Every organization must only access its own:

   ```text
   Inventory
   Products
   Orders
   Suppliers
   Calculations
   Reports
   Expenses
   ```

   ---

   # 81. RESPONSIVE DESIGN

   Desktop-first SaaS dashboard.

   Must also work on:

   ```text
   Tablet
   Mobile
   ```

   Mobile navigation:

   ```text
   Home
   Inventory
   Pricing
   Orders
   More
   ```

   ---

   # 82. UI DESIGN

   Use a premium SaaS design.

   Primary accent:

   ```text
   #6366F1
   ```

   Style:

   ```text
   Clean
   Professional
   Data-focused
   Modern
   Minimal
   ```

   Use:

   ```text
   Cards
   Charts
   Tables
   Badges
   Tooltips
   Drawers
   Modals
   Tabs
   Skeletons
   Empty States
   ```

   Do not overload the screen with unnecessary charts.

   ---

   # 83. COLOR SEMANTICS

   Use:

   ```text
   Green → Profit / Healthy
   Red → Loss / Risk
   Yellow → Warning
   Blue/Indigo → Information
   Gray → Neutral
   ```

   Do not use color as the only indicator.

   Always include text/status.

   ---

   # 84. DASHBOARD HERO

   Dashboard should answer in 5 seconds:

   ```text
   How much inventory do I have?

   How much is it worth?

   How much revenue can it generate?

   How much profit can it generate?

   Which products are losing money?

   Which marketplace is best?
   ```

   ---

   # 85. PRODUCT DETAIL PAGE

   Top section:

   ```text
   Product Image
   Product Name
   SKU
   Inventory
   Landed Cost
   ```

   Then:

   ```text
   True Profit
   True Margin
   ROI
   ```

   Then:

   ```text
   Marketplace Comparison
   ```

   Then:

   ```text
   Profit Breakdown
   ```

   Then:

   ```text
   Returns / Risk
   ```

   Then:

   ```text
   Price Simulator
   ```

   ---

   # 86. ACTUAL BUSINESS EXAMPLE

   Product:

   ```text
   Car Cleaning Brush

   Purchase Price: ₹80
   Packaging: ₹8
   Inbound Cost: ₹5
   Landed Cost: ₹93

   Selling Price: ₹399
   ```

   MarginIQ must calculate marketplace costs.

   Then:

   ```text
   Marketplace Fees
   ₹XXX

   Shipping
   ₹XX

   Advertising
   ₹XX

   Expected Returns
   ₹XX

   Expected RTO
   ₹XX

   Expected Damage
   ₹XX

   True Profit
   ₹XXX

   True Margin
   XX%
   ```

   Do not hard-code these example numbers into the application.

   They are only examples.

   ---

   # 87. IMPORTANT: ACTUAL VS ESTIMATED

   Before selling:

   ```text
   Estimated Profit
   ```

   After settlement:

   ```text
   Actual Profit
   ```

   MarginIQ should learn from the actual result.

   Example:

   ```text
   Estimated:

   Profit ₹150

   Actual:

   Profit ₹131
   ```

   Show:

   ```text
   Variance = -₹19
   ```

   Explain the variance.

   ---

   # 88. DATA QUALITY

   Every calculation must have:

   ```text
   Data Source
   Last Updated
   Confidence
   ```

   Example:

   ```text
   Amazon Fee
   Source: Official Seller Rate Card
   Updated: 06 Oct 2026
   Confidence: High
   ```

   ---

   # 89. NO FAKE LIVE DATA

   If there is no API/data source:

   DO NOT pretend the data is live.

   Use:

   ```text
   Demo Data
   Manual Input
   Imported Data
   Estimated Data
   ```

   Clearly label it.

   ---

   # 90. MARKETPLACE FEE UPDATE WORKFLOW

   Admin:

   ```text
   Open Marketplace
         ↓
   Select Fee Rule
         ↓
   Upload New Rate Card
         ↓
   Preview
         ↓
   Validate
         ↓
   Set Effective Date
         ↓
   Publish
   ```

   Existing historical calculations remain unchanged.

   ---

   # 91. TESTING

   Unit test:

   ```text
   Product Cost
   Landed Cost
   Referral Fee
   Closing Fee
   Shipping
   Volumetric Weight
   Commission
   Collection Fee
   Return Cost
   RTO Cost
   Damage Cost
   Advertising
   GST
   Break-even
   Target Price
   Margin
   ROI
   ```

   Integration tests:

   ```text
   Inventory → Product
   Product → Marketplace
   Marketplace → Profit Engine
   Profit → Pricing
   Order → Actual Profit
   Return → Profit Adjustment
   ```

   E2E:

   ```text
   Register
   Login
   Create Product
   Add Inventory
   Create Marketplace Listing
   Calculate Price
   Compare Marketplaces
   Save Product
   Create Order
   Add Return
   View Actual Profit
   Generate Report
   ```

   ---

   # 92. CURRENT PROJECT STABILITY

   The existing application has already had routing and stability fixes.

   Preserve:

   ```text
   Research page
   Reports page
   404 page
   Authenticated layout
   Landing page navigation
   Navigation search
   ```

   Do not reintroduce broken routes.

   All routes must render gracefully.

   ---

   # 93. DEVELOPMENT ORDER

   Build in this order.

   ## Phase 1

   ```text
   Inventory
   Products
   Suppliers
   Purchases
   Stock
   ```

   ## Phase 2

   ```text
   Marketplace Models
   Fee Rules
   Marketplace Provider Architecture
   ```

   ## Phase 3

   ```text
   Profitability Engine
   Shipping Engine
   Tax Engine
   Return Engine
   RTO Engine
   Damage Engine
   ```

   ## Phase 4

   ```text
   Pricing Simulator
   Target Margin Calculator
   Marketplace Comparison
   ```

   ## Phase 5

   ```text
   Orders
   Returns
   Actual Profit
   Settlement Reconciliation
   ```

   ## Phase 6

   ```text
   Product Research
   Competitor Analysis
   Opportunity Finder
   ```

   ## Phase 7

   ```text
   Reports
   Analytics
   Alerts
   AI Intelligence
   ```

   ---

   # 94. FINAL USER EXPERIENCE

   A user should be able to do this:

   ```text
   1. Add:
      Car Cleaning Brush

   2. Enter:
      Purchase Cost = ₹80

   3. Enter:
      Packaging = ₹8

   4. Enter:
      Shipping to warehouse = ₹5

   5. MarginIQ:
      Landed Cost = ₹93

   6. Select:
      Amazon

   7. Enter:
      Category
      Weight
      Dimensions
      Fulfilment

   8. Enter:
      Target Margin = 30%

   9. MarginIQ:
      Calculates recommended selling price.

   10. Compare:
      Amazon
      Flip/kart
      Meesho

   11. User chooses:
      Amazon

   12. Product is listed at:
      Recommended Price

   13. MarginIQ tracks:
      Orders
      Fees
      Returns
      RTO
      Damages
      Advertising

   14. Actual settlement arrives.

   15. MarginIQ compares:
      Estimated vs Actual.

   16. Dashboard updates:
      TRUE PROFIT.
   ```

   ---

   # 95. FINAL PRODUCT POSITIONING

   MarginIQ should ultimately become:

   > **The financial operating system for e-commerce sellers.**

   Not just:

   > Product Research Tool

   Not just:

   > Profit Calculator

   Not just:

   > Inventory Management

   Instead:

   ```text
   INVENTORY
      +
   MARKETPLACE
      +
   PRICING
      +
   FEES
      +
   LOGISTICS
      +
   RETURNS
      +
   RTO
      +
   DAMAGES
      +
   ADVERTISING
      +
   EXPENSES
      +
   ACTUAL SETTLEMENTS
      =
   TRUE E-COMMERCE PROFIT
   ```

   ---

   # 96. MOST IMPORTANT RULE

   Every number shown by MarginIQ must answer:

   > **"Where did this number come from?"**

   The user should be able to click a number and see its calculation.

   For example:

   ```text
   ₹214 Marketplace Cost
   ```

   Click:

   ```text
   Referral Fee       ₹48
   Closing Fee        ₹20
   Shipping           ₹54
   Collection Fee     ₹10
   Return Reserve     ₹18
   Advertising        ₹40
   Other Fee          ₹24
   ----------------------
   Total              ₹214
   ```

   This transparency is one of MarginIQ's biggest competitive advantages.

   ---

   # 97. BUILDING RULE

   Do not build everything as mock screens.

   Build the **real calculation architecture first**.

   Priority:

   ```text
   DATABASE
      ↓
   FEE RULE ENGINE
      ↓
   PROFITABILITY ENGINE
      ↓
   API
      ↓
   FRONTEND
   ```

   The UI should consume calculations from the backend.

   Do not duplicate financial formulas in React.

   ---

   # 98. FINAL ACCEPTANCE CRITERIA

   MarginIQ is considered successful when a seller can:

   - Add inventory.
   - Record actual purchase cost.
   - Calculate landed cost.
   - Select Amazon/Flipkart/Meesho.
   - Select category.
   - Enter dimensions and weight.
   - Select fulfilment.
   - Enter desired selling price.
   - Calculate marketplace charges.
   - Calculate shipping.
   - Calculate applicable taxes/fee taxes.
   - Add advertising.
   - Add return assumptions.
   - Add RTO assumptions.
   - Add damage assumptions.
   - Calculate expected true profit.
   - Calculate true margin.
   - Calculate ROI.
   - Find break-even price.
   - Find recommended price.
   - Compare marketplaces.
   - Track inventory.
   - Track orders.
   - Track returns.
   - Track damages.
   - Compare estimated vs actual profit.
   - Export reports.

   And most importantly:

   > **The seller should know whether a product is actually worth selling before investing money in it.**

   Build MarginIQ around this principle.
