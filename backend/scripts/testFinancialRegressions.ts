import fs from 'fs';
import path from 'path';
import assert from 'assert';
import mongoose from 'mongoose';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';

import Order from '../src/models/Order';
import Product from '../src/models/Product';
import CalculationSnapshot from '../src/models/CalculationSnapshot';
import SettlementImport from '../src/models/SettlementImport';
import SettlementTransaction from '../src/models/SettlementTransaction';

import { ProfitabilityEngine } from '../src/services/engines/ProfitabilityEngine';
import { ReturnsEngine } from '../src/services/engines/ReturnsEngine';
import { DamageEngine } from '../src/services/engines/DamageEngine';
import { AmazonSettlementParser } from '../src/services/settlement/parsers/AmazonSettlementParser';
import { ReconciliationEngine } from '../src/services/reconciliation/ReconciliationEngine';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING FINANCIAL REGRESSION TESTS ---');
  await connectDB();

  const orgId = new mongoose.Types.ObjectId();
  const importId = new mongoose.Types.ObjectId();

  try {
    // ---------------------------------------------------------
    // TEST 1: Amazon ₹199 Accounting Regression (Order: 402-6921987-6804352)
    // ---------------------------------------------------------
    console.log('\n[TEST 1] Amazon ₹199 Exact Accounting Regression');

    const product = new Product({
      organizationId: orgId,
      name: 'Amazon Regression Test Product',
      sku: 'AMZ-REG-199',
      category: new mongoose.Types.ObjectId(),
      dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10, deadWeightKg: 0.25 },
      costSettings: { purchasePrice: 100, landedCost: 100, packagingCost: 0, taxRate: 18 }
    });
    await product.save();

    // Calculate Expected Profitability
    const expectedProf = await ProfitabilityEngine.calculate({
      marketplaceCode: 'amazon',
      sellingPrice: 199,
      productLandedCost: 100,
      productGstPercent: 18,
      weight: 250,
      length: 10,
      width: 10,
      height: 10,
      packagingCost: 0,
      fulfilmentType: 'fba',
      zone: 'national',
      paymentMethod: 'prepaid',
      origin: 'delhi',
      destination: 'mumbai',
      rtoPercent: 0,
      customerReturnPercent: 0,
      damagePercent: 0,
      reimbursementPercent: 0
    });

    const snapshot = new CalculationSnapshot({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      sellingPrice: 199,
      productLandedCost: 100,
      fees: expectedProf.fees,
      shipping: expectedProf.shipping,
      returns: expectedProf.returns,
      damage: expectedProf.damage,
      advertising: expectedProf.advertising,
      discounts: expectedProf.discounts,
      tax: expectedProf.tax,
      totalCost: expectedProf.totalCost,
      expectedProfit: expectedProf.netProfit,
      expectedMargin: expectedProf.netMargin,
      calculationVersion: '1.0'
    });
    await snapshot.save();

    const orderId = '402-6921987-6804352';
    const order = new Order({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: orderId,
      productId: product._id,
      orderDate: new Date('2026-03-05T12:26:14Z'),
      status: 'Pending',
      settlementStatus: 'Unsettled',
      sellingPrice: 199,
      calculationSnapshotId: snapshot._id,
      expectedProfit: expectedProf.netProfit,
      expectedMargin: expectedProf.netMargin
    });
    await order.save();

    // Import real Amazon settlement CSV
    const csvPath = path.join(__dirname, '../amazon_settlement_sample.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const parser = new AmazonSettlementParser();
    const records: any[] = [];
    const csvParser = parse(csvData, { columns: true, skip_empty_lines: true });

    for await (const record of csvParser) {
      records.push(record);
    }
    const normalized = await parser.parse(records);

    for (const tx of normalized) {
      await new SettlementTransaction({
        organizationId: orgId,
        importId,
        marketplaceCode: parser.marketplaceCode,
        marketplaceOrderId: tx.marketplaceOrderId,
        transactionId: tx.transactionId,
        transactionType: tx.transactionType,
        transactionDate: tx.transactionDate,
        principalAmount: tx.principalAmount,
        totalMarketplaceFees: tx.totalMarketplaceFees,
        taxLiable: tx.taxLiable,
        tcsAmount: tx.tcsAmount,
        totalTaxes: tx.totalTaxes,
        totalShipping: tx.totalShipping,
        otherDeductions: tx.otherDeductions,
        netSettlementAmount: tx.netSettlementAmount,
        rawTransactionData: tx.rawTransactionData
      }).save();
    }

    // Run reconciliation matching
    await ReconciliationEngine.runMatching(orgId.toString());

    const reconOrder = await Order.findById(order._id);
    assert.ok(reconOrder, 'Reconciled order must exist');

    console.log(`Order ID:         ${reconOrder.marketplaceOrderId}`);
    console.log(`Expected Revenue: ₹${reconOrder.sellingPrice}`);
    console.log(`Actual Gross Rev: ₹${reconOrder.actualGrossRevenue}`);
    console.log(`Actual Profit:    ₹${reconOrder.actualProfit}`);
    console.log(`Revenue Variance: ₹${reconOrder.revenueVariance}`);

    // Exact Amazon Regression assertions
    assert.strictEqual(reconOrder.sellingPrice, 199, 'Expected Revenue must be ₹199');
    assert.strictEqual(reconOrder.actualGrossRevenue, 199, 'Actual Gross Revenue must be ₹199');
    assert.strictEqual(reconOrder.revenueVariance, 0, 'Revenue Variance must be ₹0');
    assert.strictEqual(
      Math.round(reconOrder.actualProfit! * 100) / 100,
      -15.14,
      'Actual Profit must exactly equal -₹15.14'
    );
    assert.strictEqual(reconOrder.actualMarketplaceFees, -7.08, 'Marketplace fees must equal -₹7.08');
    assert.strictEqual(reconOrder.actualShipping, -76.7, 'Shipping must equal -₹76.70');
    assert.strictEqual(reconOrder.actualTaxes, 30.36, 'GST Output must equal ₹30.36');
    assert.strictEqual(reconOrder.actualTCS, -0.84, 'TCS must equal -₹0.84');
    console.log('✅ TEST 1 (Amazon ₹199 Regression): PASSED');

    // ---------------------------------------------------------
    // TEST 2: Deterministic Accounting Signs & Pass-Throughs
    // ---------------------------------------------------------
    console.log('\n[TEST 2] Deterministic Accounting Signs (Fees, Shipping, Deductions)');
    const detOrderId = `DET-${Date.now()}`;
    const detOrder = new Order({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: detOrderId,
      productId: product._id,
      calculationSnapshotId: snapshot._id,
      orderDate: new Date(),
      sellingPrice: 1000,
      expectedProfit: 350,
      expectedMargin: 35
    });
    await detOrder.save();

    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: detOrderId,
      transactionId: `TX-REV-${Date.now()}`,
      transactionType: 'Order',
      transactionDate: new Date(),
      principalAmount: 1000,
      netSettlementAmount: 1000
    }).save();

    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: detOrderId,
      transactionId: `TX-FEE-${Date.now()}`,
      transactionType: 'ServiceFee',
      transactionDate: new Date(),
      totalMarketplaceFees: -150,
      netSettlementAmount: -150
    }).save();

    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: detOrderId,
      transactionId: `TX-SHIP-${Date.now()}`,
      transactionType: 'ServiceFee',
      transactionDate: new Date(),
      totalShipping: -80,
      netSettlementAmount: -80
    }).save();

    await ReconciliationEngine.runMatching(orgId.toString());

    const detRecon = await Order.findById(detOrder._id);
    // Revenue: 1000, Product Cost: 100, Fees: -150, Shipping: -80 => 1000 - 100 - 150 - 80 = 670
    assert.strictEqual(detRecon?.actualGrossRevenue, 1000);
    assert.strictEqual(detRecon?.actualMarketplaceFees, -150);
    assert.strictEqual(detRecon?.actualShipping, -80);
    assert.strictEqual(detRecon?.actualProfit, 670);
    console.log('✅ TEST 2 (Deterministic Signs): PASSED');

    // ---------------------------------------------------------
    // TEST 3: Refunds and Negative Adjustments Handling
    // ---------------------------------------------------------
    console.log('\n[TEST 3] Refund Handling');
    const refOrderId = `REF-${Date.now()}`;
    const refOrder = new Order({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: refOrderId,
      productId: product._id,
      calculationSnapshotId: snapshot._id,
      orderDate: new Date(),
      sellingPrice: 500,
      expectedProfit: 150,
      expectedMargin: 30
    });
    await refOrder.save();

    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: refOrderId,
      transactionId: `TX-REF-1-${Date.now()}`,
      transactionType: 'Order',
      transactionDate: new Date(),
      principalAmount: 500,
      netSettlementAmount: 500
    }).save();

    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: refOrderId,
      transactionId: `TX-REF-2-${Date.now()}`,
      transactionType: 'Refund',
      transactionDate: new Date(),
      principalAmount: -500,
      netSettlementAmount: -500
    }).save();

    await ReconciliationEngine.runMatching(orgId.toString());
    const reconRefund = await Order.findById(refOrder._id);
    assert.strictEqual(reconRefund?.actualRefund, -500, 'Actual refund must be recorded as -500');
    console.log('✅ TEST 3 (Refunds): PASSED');

    // ---------------------------------------------------------
    // TEST 4: Transfer Exclusion (Bank Transfers Must Not Alter Orders)
    // ---------------------------------------------------------
    console.log('\n[TEST 4] Transfer Exclusion Protection');
    const transferTx = new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: detOrderId,
      transactionId: `TX-TRF-${Date.now()}`,
      transactionType: 'Other',
      transactionDate: new Date(),
      netSettlementAmount: -5000,
      rawTransactionData: { type: 'Transfer' }
    });
    await transferTx.save();

    await ReconciliationEngine.runMatching(orgId.toString());
    const detAfterTransfer = await Order.findById(detOrder._id);
    assert.strictEqual(
      detAfterTransfer?.actualProfit,
      670,
      'Transfer transaction must be excluded from order profit'
    );
    console.log('✅ TEST 4 (Transfer Exclusion): PASSED');

    // ---------------------------------------------------------
    // TEST 5: Duplicate Settlement Protection
    // ---------------------------------------------------------
    console.log('\n[TEST 5] Duplicate Settlement Protection');
    const dupTxId = `DUP-TX-${Date.now()}`;
    const firstTx = new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'ORD-DUP',
      transactionId: dupTxId,
      transactionType: 'Order',
      transactionDate: new Date(),
      netSettlementAmount: 100
    });
    await firstTx.save();

    let duplicateRejected = false;
    try {
      const secondTx = new SettlementTransaction({
        organizationId: orgId,
        importId,
        marketplaceCode: 'amazon',
        marketplaceOrderId: 'ORD-DUP',
        transactionId: dupTxId,
        transactionType: 'Order',
        transactionDate: new Date(),
        netSettlementAmount: 100
      });
      await secondTx.save();
    } catch (err: any) {
      duplicateRejected = true;
      assert.strictEqual(err.code, 11000, 'Duplicate transaction must trigger MongoDB code 11000');
    }
    assert.strictEqual(duplicateRejected, true, 'Duplicate transaction must be rejected');
    console.log('✅ TEST 5 (Duplicate Protection): PASSED');

    // ---------------------------------------------------------
    // TEST 6: RTO and Damage Formula Engine Verification
    // ---------------------------------------------------------
    console.log('\n[TEST 6] RTO and Damage Loss Engine Verification');
    const returnRes = ReturnsEngine.calculate({
      rtoPercent: 10,
      customerReturnPercent: 5,
      forwardShippingCost: 80,
      returnShippingCostRTO: 60,
      returnShippingCostCustomer: 70,
      marketplaceReturnFee: 15,
      repackagingCost: 20
    });
    // rtoCostPerOrder = 80 + 60 + 20 = 160 => statisticalRtoCost = 0.10 * 160 = 16
    assert.strictEqual(returnRes.statisticalRtoCost, 16, 'Statistical RTO cost should equal 16');
    // crCostPerOrder = 80 + 70 + 15 + 20 = 185 => statisticalCustomerReturnCost = 0.05 * 185 = 9.25
    assert.strictEqual(returnRes.statisticalCustomerReturnCost, 9.25, 'Customer return cost should equal 9.25');
    assert.strictEqual(returnRes.totalStatisticalReturnCost, 25.25, 'Total return cost should equal 25.25');

    const damageRes = DamageEngine.calculate({
      damagePercent: 2,
      productCost: 500,
      reimbursementPercent: 40
    });
    // costPerDamagedUnit = 500, recovered = 200 => netLoss = 300 => statisticalDamageLoss = 0.02 * 300 = 6
    assert.strictEqual(damageRes.statisticalDamageLoss, 6, 'Damage statistical loss should equal 6');
    console.log('✅ TEST 6 (RTO & Damage Engines): PASSED');

    console.log('\n==========================================');
    console.log('ALL FINANCIAL REGRESSION TESTS PASSED (6/6)');
    console.log('Amazon Regression Preserved:');
    console.log('  Revenue: ₹199');
    console.log('  Actual Profit: -₹15.14');
    console.log('  Revenue Variance: ₹0');
    console.log('==========================================');
  } finally {
    // Clean up
    await Product.deleteMany({ organizationId: orgId });
    await Order.deleteMany({ organizationId: orgId });
    await CalculationSnapshot.deleteMany({ organizationId: orgId });
    await SettlementTransaction.deleteMany({ organizationId: orgId });
    await SettlementImport.deleteMany({ _id: importId });
  }
};

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Financial Regression Test Failed:', err);
    process.exit(1);
  });
