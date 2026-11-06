import mongoose from 'mongoose';
import Organization from '../../models/Organization';
import Product from '../../models/Product';
import Supplier from '../../models/Supplier';
import ProductSupplier from '../../models/ProductSupplier';
import Purchase from '../../models/Purchase';
import ProductBatch from '../../models/ProductBatch';
import Order from '../../models/Order';
import CalculationSnapshot from '../../models/CalculationSnapshot';
import SettlementImport from '../../models/SettlementImport';
import SettlementTransaction from '../../models/SettlementTransaction';
import OperationalEvent from '../../models/OperationalEvent';
import { ProfitabilityEngine } from '../engines/ProfitabilityEngine';
import { LandedCostService } from '../costing/LandedCostService';
import { ReconciliationEngine } from '../reconciliation/ReconciliationEngine';

export async function seedDemoData(targetOrgId?: string | mongoose.Types.ObjectId, userId?: string) {
  let orgId = targetOrgId ? new mongoose.Types.ObjectId(targetOrgId) : null;

  if (!orgId) {
    let org = await Organization.findOne({ name: 'Demo Ecommerce Organization' });
    if (!org) {
      org = await Organization.create({
        name: 'Demo Ecommerce Organization',
        subscriptionPlan: 'Business',
      });
    }
    orgId = org._id as mongoose.Types.ObjectId;
  }

  // 1. Supplier: Ahmedabad Auto Accessories Supplier
  let supplier = await Supplier.findOne({ organizationId: orgId, companyName: 'Ahmedabad Auto Accessories Supplier' });
  if (!supplier) {
    supplier = await Supplier.create({
      organizationId: orgId,
      companyName: 'Ahmedabad Auto Accessories Supplier',
      contactName: 'Suresh Patel',
      phone: '+91 98250 12345',
      email: 'suresh@ahmedabadauto.in',
      address: '42 GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat 382445',
      gstin: '24ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      paymentTerms: 'Net 30',
      leadTimeDays: 7,
      minimumOrderQuantity: 50,
      notes: 'Primary verified supplier for mobile holders & mounts',
      status: 'Active',
    });
  }

  // 2. Product Master: Car Mobile Holder Magnetic Mount (CMH001)
  let product = await Product.findOne({ organizationId: orgId, sku: 'CMH001' });
  if (!product) {
    product = await Product.create({
      organizationId: orgId,
      name: 'Car Mobile Holder Magnetic Mount',
      sku: 'CMH001',
      barcode: '8901234567890',
      brand: 'DriveGrip Pro',
      category: 'Car Accessories',
      subcategory: 'Mobile Mounts',
      hsnCode: '8708',
      gstRate: 18,
      description: 'Universal 360-degree magnetic car mobile holder with ultra-strong neodymium magnets.',
      images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500&auto=format&fit=crop'],
      supplier: supplier._id,
      purchasePrice: 120,
      defaultLandedCost: 145,
      packagingCost: 10,
      labelCost: 3,
      inboundShipping: 7,
      inspectionCost: 5,
      importCost: 0,
      otherProcurementCost: 0,
      weight: 320,
      dimensions: { length: 15, width: 10, height: 8 },
      currentStock: 100,
      availableStock: 100,
      costingMethod: 'WAC',
      unit: 'pcs',
      status: 'Active',
      sellingStatus: 'Active',
      source: 'MANUAL',
      confidence: 'VERIFIED',
    });
  }

  // 3. ProductSupplier Relationship
  await ProductSupplier.findOneAndUpdate(
    { organizationId: orgId, productId: product._id, supplierId: supplier._id },
    {
      organizationId: orgId,
      productId: product._id,
      supplierId: supplier._id,
      supplierSku: 'AAA-CMH-MAG',
      purchasePrice: 120,
      moq: 50,
      leadTimeDays: 7,
      gstRate: 18,
      packagingInfo: 'Blister packed with metallic plate inside cardboard retail box',
      isPrimary: true,
      status: 'Active',
    },
    { upsert: true }
  );

  // 4. Purchase Order & True Landed Cost Batch
  let purchase = await Purchase.findOne({ organizationId: orgId, purchaseOrderNumber: 'PO-DEMO-001' });
  if (!purchase) {
    purchase = await Purchase.create({
      organizationId: orgId,
      supplierId: supplier._id,
      purchaseOrderNumber: 'PO-DEMO-001',
      invoiceNumber: 'INV-AAA-8891',
      orderDate: new Date('2026-03-01'),
      status: 'Received',
      paymentStatus: 'Paid',
      items: [
        {
          productId: product._id,
          quantity: 100,
          unitCost: 120,
          totalCost: 12000,
        },
      ],
      subtotal: 12000,
      shippingCost: 700,
      taxAmount: 0,
      otherCosts: 1800,
      totalAmount: 14500,
    });
  }

  // Batch
  await ProductBatch.findOneAndUpdate(
    { organizationId: orgId, batchNumber: 'BATCH-PO-DEMO-001-1' },
    {
      organizationId: orgId,
      productId: product._id,
      purchaseId: purchase._id,
      supplierId: supplier._id,
      batchNumber: 'BATCH-PO-DEMO-001-1',
      quantityPurchased: 100,
      quantityReceived: 100,
      quantityAvailable: 100,
      unitPurchaseCost: 120,
      freightAllocation: 7,
      packagingAllocation: 10,
      labellingAllocation: 3,
      inspectionAllocation: 5,
      otherCostAllocation: 0,
      totalLandedCost: 14500,
      unitLandedCost: 145,
      purchaseDate: new Date('2026-03-01'),
      warehouse: 'Ahmedabad Main Hub',
    },
    { upsert: true }
  );

  // 5. Evaluate Multi-Marketplace Calculations at ₹399
  const sellingPrice = 399;
  const amzCalc = await ProfitabilityEngine.calculate({
    marketplaceCode: 'amazon',
    sellingPrice,
    productLandedCost: 145,
    productGstPercent: 18,
    weight: 320,
    length: 15,
    width: 10,
    height: 8,
    packagingCost: 0, // Inbound packaging already factored in landed cost
    fulfilmentType: 'fba',
    zone: 'national',
    paymentMethod: 'prepaid',
    origin: 'ahmedabad',
    destination: 'mumbai',
    rtoPercent: 5,
    customerReturnPercent: 5,
    damagePercent: 1,
    reimbursementPercent: 50,
    advertisingPercent: 6,
  });

  // 6. Frozen CalculationSnapshot & Order
  const orderIdStr = 'DEMO-ORDER-402-1001';
  let snapshot = await CalculationSnapshot.findOne({ organizationId: orgId, marketplaceCode: 'amazon', productId: product._id });
  if (!snapshot) {
    snapshot = await CalculationSnapshot.create({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      productId: product._id,
      supplierId: supplier._id,
      sellingPrice,
      productLandedCost: 145,
      fees: amzCalc.fees,
      shipping: amzCalc.shipping,
      returns: amzCalc.returns,
      damage: amzCalc.damage,
      advertising: amzCalc.advertising,
      discounts: amzCalc.discounts,
      tax: amzCalc.tax,
      totalCost: amzCalc.totalCost,
      expectedProfit: amzCalc.netProfit,
      expectedMargin: amzCalc.netMargin,
      feeRuleVersionsApplied: [],
      calculationVersion: '1.0',
      source: 'PROFITABILITY_ENGINE',
      confidence: 'VERIFIED',
    });
  }

  let order = await Order.findOne({ organizationId: orgId, marketplaceOrderId: orderIdStr });
  if (!order) {
    order = await Order.create({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: orderIdStr,
      productId: product._id,
      orderDate: new Date('2026-03-05'),
      status: 'Delivered',
      settlementStatus: 'Settled',
      reconciliationStatus: 'Unmatched',
      sellingPrice,
      discountAmount: 0,
      calculationSnapshotId: snapshot._id,
      expectedProfit: amzCalc.netProfit,
      expectedMargin: amzCalc.netMargin,
    });
  }

  // 7. Settlement Import & Transaction
  let settlementImport = await SettlementImport.findOne({ organizationId: orgId, originalFileName: 'demo_amazon_settlement.csv' });
  if (!settlementImport) {
    settlementImport = await SettlementImport.create({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      originalFileName: 'demo_amazon_settlement.csv',
      status: 'Completed',
      totalRows: 1,
      successfulRows: 1,
      failedRows: 0,
    });
  }

  await SettlementTransaction.findOneAndUpdate(
    { organizationId: orgId, marketplaceOrderId: orderIdStr },
    {
      organizationId: orgId,
      importId: settlementImport._id,
      marketplaceCode: 'amazon',
      marketplaceOrderId: orderIdStr,
      transactionId: 'TX-AMZ-DEMO-001',
      transactionType: 'Order',
      transactionDate: new Date('2026-03-07'),
      principalAmount: 399.0,
      totalMarketplaceFees: -45.0,
      totalShipping: -82.0,
      taxLiable: 0,
      tcsAmount: -0.84,
      totalTaxes: -0.84,
      otherDeductions: 0,
      netSettlementAmount: 271.16,
      reconciliationStatus: 'Matched',
      matchedOrderId: order._id,
      matchConfidence: 'High',
      rawTransactionData: {},
    },
    { upsert: true }
  );

  // Run Reconciliation
  await ReconciliationEngine.reconcileOrder(order._id, orgId);

  // 8. Operational Events
  await OperationalEvent.findOneAndUpdate(
    { organizationId: orgId, marketplaceOrderId: orderIdStr, eventType: 'CUSTOMER_RETURN' } as any,
    {
      organizationId: orgId,
      orderId: order._id,
      marketplaceOrderId: order.marketplaceOrderId,
      productId: product._id,
      eventType: 'CUSTOMER_RETURN',
      costs: {
        forwardShipping: 82,
        reverseShipping: 82,
        marketplaceFee: 15,
        packagingLoss: 10,
        damageDepreciation: 25,
        productCost: 145,
        repairDisposal: 0,
        otherCosts: 0,
        totalLoss: 214,
      },
      eventDate: new Date('2026-03-09'),
      claimStatus: 'NOT_CLAIMED',
      reimbursedAmount: 0,
      notes: 'Customer returned unit; blister packaging was opened',
    },
    { upsert: true }
  );

  return {
    organizationId: orgId.toString(),
    product: { id: product._id, name: product.name, sku: product.sku, landedCost: 145 },
    supplier: { id: supplier._id, name: supplier.companyName },
    order: { id: order._id, marketplaceOrderId: order.marketplaceOrderId, expectedProfit: amzCalc.netProfit },
    economics: {
      amazonProfit: amzCalc.netProfit,
      flipkartProfit: 190.59,
      meeshoProfit: 214.53,
      d2cProfit: 181.0,
    },
  };
}
