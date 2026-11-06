import fs from 'fs';
import mongoose from 'mongoose';
import { parse } from 'csv-parse';
import { AmazonSettlementParser } from '../src/services/settlement/parsers/AmazonSettlementParser';
import { ReconciliationEngine } from '../src/services/reconciliation/ReconciliationEngine';
import Order from '../src/models/Order';
import SettlementTransaction from '../src/models/SettlementTransaction';
import CalculationSnapshot from '../src/models/CalculationSnapshot';
import { ProfitabilityEngine } from '../src/services/engines/ProfitabilityEngine';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';

dotenv.config();

const runTests = async () => {
  console.log('Connecting to database...');
  await connectDB();
  
  const orgId = new mongoose.Types.ObjectId();
  const importId = new mongoose.Types.ObjectId();
  
  console.log('\n==========================================');
  console.log('PHASE 5.8: RECONCILIATION DETERMINISTIC TESTS');
  console.log('==========================================');

  try {
    // 1. DETERMINISTIC TEST (Most Important)
    console.log('\n[TEST 1] DETERMINISTIC ACCOUNTING SIGN TEST');
    /*
      Selling price: ₹1,000
      Product cost: ₹400
      Marketplace fees: -₹150
      Shipping: -₹80
      Other actual costs: -₹20

      Expected contribution profit:
      1000 - 400 - 150 - 80 - 20 = 350
    */
    
    // Create Snapshot
    const snapshot = new CalculationSnapshot({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      sellingPrice: 1000,
      productLandedCost: 400,
      fees: { totalMarketplaceFees: 150 },
      shipping: { totalShippingCost: 80 },
      tax: { netGstPayable: 0 },
      totalCost: 650, // 400 + 150 + 80 + 20
      expectedProfit: 350,
      expectedMargin: 35,
      calculationVersion: '1.0'
    });
    await snapshot.save();

    // Create Order
    const order = new Order({
      organizationId: orgId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      productId: new mongoose.Types.ObjectId(),
      orderDate: new Date(),
      sellingPrice: 1000,
      expectedProfit: 350,
      expectedMargin: 35,
      calculationSnapshotId: snapshot._id,
      reconciliationStatus: 'Unmatched'
    });
    await order.save();

    // Create Settlement Transactions
    // 1. Revenue
    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      transactionId: 'TX1',
      transactionType: 'Order',
      transactionDate: new Date(),
      principalAmount: 1000,
      netSettlementAmount: 1000
    }).save();

    // 2. Fees
    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      transactionId: 'TX2',
      transactionType: 'ServiceFee',
      transactionDate: new Date(),
      totalMarketplaceFees: -150,
      netSettlementAmount: -150
    }).save();

    // 3. Shipping
    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      transactionId: 'TX3',
      transactionType: 'ServiceFee',
      transactionDate: new Date(),
      totalShipping: -80,
      netSettlementAmount: -80
    }).save();

    // 4. Other
    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      transactionId: 'TX4',
      transactionType: 'Adjustment',
      transactionDate: new Date(),
      otherDeductions: -20,
      netSettlementAmount: -20
    }).save();

    // Run Engine
    await ReconciliationEngine.runMatching(orgId);

    // Verify
    const updatedOrder = await Order.findById(order._id);
    console.log(`Expected Profit: ₹350`);
    console.log(`Calculated Actual Profit: ₹${updatedOrder?.actualProfit}`);
    
    if (updatedOrder?.actualProfit === 350) {
      console.log('✅ Deterministic Test PASSED');
    } else {
      console.log('❌ Deterministic Test FAILED');
    }

    console.log('\n[TEST 2] TRANSFER IS IGNORED');
    // Add a transfer
    await new SettlementTransaction({
      organizationId: orgId,
      importId,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'DETERMINISTIC-123',
      transactionId: 'TX5',
      transactionType: 'Other',
      transactionDate: new Date(),
      netSettlementAmount: -250,
      rawTransactionData: { type: 'Transfer' }
    }).save();

    await SettlementTransaction.updateMany({ matchedOrderId: order._id }, { reconciliationStatus: 'Unmatched' });
    await ReconciliationEngine.runMatching(orgId);
    
    const transferOrder = await Order.findById(order._id);
    if (transferOrder?.actualProfit === 350) {
      console.log('✅ Transfer Ignore Test PASSED');
    } else {
      console.log(`❌ Transfer Ignore Test FAILED (Profit changed to ${transferOrder?.actualProfit})`);
    }

    console.log('\n[TEST 3] REAL AMAZON PARSER VALIDATION');
    const parser = new AmazonSettlementParser();
    const csvData = fs.readFileSync('amazon_settlement_sample.csv', 'utf-8');
    
    const records: any[] = [];
    const csvParser = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    for await (const record of csvParser) {
      records.push(record);
    }
    
    const parsedTxs = await parser.parse(records);
    const valid = parser.validate(parsedTxs);
    
    console.log(`Total Rows Parsed from Real CSV: ${parsedTxs.length}`);
    console.log(`Parser Validation Passed: ${valid.isValid}`);
    
    // Check specific extraction logic
    const aRefund = parsedTxs.find(t => t.transactionType === 'Refund');
    console.log('Sample Refund Parsed:', {
      orderId: aRefund?.marketplaceOrderId,
      principal: aRefund?.principalAmount,
      fees: aRefund?.totalMarketplaceFees,
      net: aRefund?.netSettlementAmount
    });
    
    if (valid.isValid && parsedTxs.length > 0) {
      console.log('✅ Real Amazon Parsing Test PASSED');
    }

  } catch (error) {
    console.error('Test Suite Failed:', error);
  } finally {
    // Cleanup
    await Order.deleteMany({ organizationId: orgId });
    await SettlementTransaction.deleteMany({ organizationId: orgId });
    await CalculationSnapshot.deleteMany({ organizationId: orgId });
    console.log('\nCleanup completed.');
    process.exit(0);
  }
};

runTests();
