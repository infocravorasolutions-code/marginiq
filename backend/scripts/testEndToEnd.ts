import mongoose from 'mongoose';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import Organization from '../src/models/Organization';
import User from '../src/models/User';
import Product from '../src/models/Product';
import ProductBatch from '../src/models/ProductBatch';
import Order from '../src/models/Order';
import SettlementImport from '../src/models/SettlementImport';
import SettlementTransaction from '../src/models/SettlementTransaction';
import CalculationSnapshot from '../src/models/CalculationSnapshot';
import { AmazonSettlementParser } from '../src/services/settlement/parsers/AmazonSettlementParser';
import { ReconciliationEngine } from '../src/services/reconciliation/ReconciliationEngine';
import { ProfitabilityEngine } from '../src/services/engines/ProfitabilityEngine';

dotenv.config();

const runE2E = async () => {
  console.log('--- STARTING E2E TEST ---');
  await connectDB();

  // 1. Setup Org
  const org = new Organization({ name: 'E2E Test Org', industry: 'Retail' });
  await org.save();
  const orgId = org._id as mongoose.Types.ObjectId;
  console.log('✅ Created Organization');

  try {
    // 1.5 Create Category (Dummy ID)
    const categoryId = new mongoose.Types.ObjectId();

    // 2. Create Product
    const product = new Product({
      organizationId: orgId,
      name: 'Cute Duck Oil Dispenser Bottle',
      sku: 'KOD01',
      category: categoryId,
      purchasePrice: 100, // ex-GST cost
      defaultLandedCost: 100,
      weight: 500,
      dimensions: { length: 10, width: 10, height: 10 },
      gstRate: 18,
      status: 'Active'
    });
    await product.save();
    console.log('✅ Created Product KOD01');

    // 3. Expected Profit Calculation
    const profitabilityInput = {
      marketplaceCode: 'amazon',
      categoryId: categoryId.toString(),
      sellingPrice: 168.64 + 30.36, // The CSV says sales: 168.64, tax: 30.36 = 199 total
      productLandedCost: 100,
      productGstPercent: 18,
      isGstRegistered: true,
      productCostIncludesGst: false,
      weight: 500,
      length: 10,
      width: 10,
      height: 10,
      packagingCost: 5,
      fulfilmentType: 'Easy Ship',
      zone: 'National',
      paymentMethod: 'Prepaid',
      origin: 'Delhi',
      destination: 'ODISHA', // from CSV
      rtoPercent: 5,
      customerReturnPercent: 10,
      damagePercent: 2,
      reimbursementPercent: 40,
    };

    const expectedProf = await ProfitabilityEngine.calculate(profitabilityInput);
    
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
      feeRuleVersionsApplied: [],
      calculationVersion: '1.0'
    });
    await snapshot.save();
    console.log(`✅ Calculated Expected Profit: ₹${expectedProf.netProfit.toFixed(2)}`);

    // 4. Create Order
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
    console.log(`✅ Created Expected Order: ${orderId}`);

    // 5. Upload & Parse CSV
    console.log('Uploading real Amazon CSV...');
    const settlementImport = new SettlementImport({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      originalFileName: 'amazon_settlement_sample.csv',
      status: 'Processing'
    });
    await settlementImport.save();

    const csvData = fs.readFileSync(path.join(__dirname, '../amazon_settlement_sample.csv'), 'utf-8');
    const parser = new AmazonSettlementParser();
    const records: any[] = [];
    const csvParser = parse(csvData, { columns: true, skip_empty_lines: true });
    
    for await (const record of csvParser) {
      records.push(record);
    }
    const normalized = await parser.parse(records);
    
    let successCount = 0;
    for (const tx of normalized) {
      try {
        const settlementTx = new SettlementTransaction({
          organizationId: orgId,
          importId: settlementImport._id,
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
        });
        await settlementTx.save();
        successCount++;
      } catch (err: any) {
        if (err.code !== 11000) console.error(err);
      }
    }
    
    settlementImport.totalRows = normalized.length;
    settlementImport.successfulRows = successCount;
    settlementImport.status = 'Completed';
    await settlementImport.save();
    console.log(`✅ Imported ${successCount} transactions successfully`);

    // 6. Run Reconciliation
    console.log('Running ReconciliationEngine...');
    await ReconciliationEngine.runMatching(orgId);

    // 7. Verify Order actuals
    const reconOrder = await Order.findById(order._id);
    if (!reconOrder) throw new Error('Order missing');

    console.log('\n--- ORDER PROFITABILITY REPORT ---');
    console.log(`Order ID:          ${reconOrder.marketplaceOrderId}`);
    console.log(`Expected Revenue:  ₹${reconOrder.sellingPrice}`);
    console.log(`Actual Gross Rev:  ₹${reconOrder.actualGrossRevenue}`);
    console.log(`Actual Prod Rev:   ₹${reconOrder.actualProductRevenue}`);
    console.log(`Marketplace Fees:  ₹${reconOrder.actualMarketplaceFees}`);
    console.log(`Shipping:          ₹${reconOrder.actualShipping}`);
    console.log(`Refunds:           ₹${reconOrder.actualRefund}`);
    console.log(`Taxes Liable:      ₹${reconOrder.actualTaxes}`);
    console.log(`TCS Amount:        ₹${reconOrder.actualTCS}`);
    console.log(`Adjustments:       ₹${reconOrder.actualAdjustments}`);
    console.log(`Expected Profit:   ₹${reconOrder.expectedProfit}`);
    console.log(`Actual Profit:     ₹${reconOrder.actualProfit}`);
    console.log(`Profit Variance:   ₹${reconOrder.profitVariance}`);
    console.log(`Recon Status:      ${reconOrder.reconciliationStatus}`);
    console.log('----------------------------------\n');

    // 7.1 Assertions based on Phase 5 accounting verification
    try {
      // 1. GST-inclusive expected vs reconstructed Gross Revenue
      assert.strictEqual(reconOrder.sellingPrice, 199, 'Expected Revenue should be 199');
      assert.strictEqual(reconOrder.actualGrossRevenue, 199, 'Gross Revenue should be reconstructed to 199');
      
      // 2. Revenue variance becomes zero
      assert.strictEqual(reconOrder.revenueVariance, 0, 'Revenue variance should be 0');
      
      // 3. GST remains a pass-through (Actual Profit remains -15.14)
      assert.strictEqual(Math.round(reconOrder.actualProfit! * 100) / 100, -15.14, 'Actual Profit should exactly equal -15.14');
      
      // 4. ₹7.08 closing fee is classified correctly
      assert.strictEqual(reconOrder.actualMarketplaceFees, -7.08, 'Marketplace fees should include the -7.08 closing fee');
      
      // 5. Genuine unknown adjustments are zero for this order
      assert.strictEqual(reconOrder.actualAdjustments, 0, 'Adjustments should be 0');
      
      // 6. Taxes and TCS properly isolated
      assert.strictEqual(reconOrder.actualTaxes, 30.36, 'Output GST should be 30.36');
      assert.strictEqual(reconOrder.actualTCS, -0.84, 'TCS should be -0.84');
      
      console.log('✅ All accounting assertions passed successfully!');
    } catch (assertionError) {
      console.error('❌ Accounting Assertion Failed:', assertionError);
      process.exit(1);
    }

    // 8. Duplicate Test
    console.log('Uploading same CSV again to test duplicate protection...');
    let duplicateSuccessCount = 0;
    for (const tx of normalized) {
      try {
        const settlementTx = new SettlementTransaction({
          organizationId: orgId,
          importId: settlementImport._id, // mock
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
        });
        await settlementTx.save();
        duplicateSuccessCount++;
      } catch (err: any) {
        if (err.code !== 11000) console.error(err);
      }
    }
    console.log(`✅ Duplicate import skipped ${normalized.length - duplicateSuccessCount} transactions`);
    console.log(`✅ Transactions inserted on duplicate run: ${duplicateSuccessCount}`);

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    // Cleanup
    await Organization.findByIdAndDelete(orgId);
    await Product.deleteMany({ organizationId: orgId });
    await Order.deleteMany({ organizationId: orgId });
    await SettlementImport.deleteMany({ organizationId: orgId });
    await SettlementTransaction.deleteMany({ organizationId: orgId });
    await CalculationSnapshot.deleteMany({ organizationId: orgId });
    console.log('Cleaned up database');
    process.exit(0);
  }
};

runE2E();
