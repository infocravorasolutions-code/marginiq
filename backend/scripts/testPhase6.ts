import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import Organization from '../src/models/Organization';
import Product from '../src/models/Product';
import Order from '../src/models/Order';
import Alert from '../src/models/Alert';
import { AnalyticsService } from '../src/services/analytics/AnalyticsService';
import { AlertService } from '../src/services/alerts/AlertService';
import { ReportService } from '../src/services/reports/ReportService';
import { jsonToCsv } from '../src/utils/csvExport';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING PHASE 6 ANALYTICS TESTS ---');
  await connectDB();

  // 1. Setup Data
  const org = new Organization({ name: 'Phase 6 Test Org', industry: 'Retail' });
  await org.save();
  const orgId = org._id.toString();

  const product1 = new Product({
    organizationId: org._id,
    name: 'Profitable Product',
    sku: `PROD-01-${Date.now()}`,
    category: new mongoose.Types.ObjectId(),
    purchasePrice: 100,
    defaultLandedCost: 100,
    status: 'Active'
  });
  
  const product2 = new Product({
    organizationId: org._id,
    name: 'Loss Product',
    sku: `PROD-02-${Date.now()}`,
    category: new mongoose.Types.ObjectId(),
    purchasePrice: 500,
    defaultLandedCost: 500,
    status: 'Active'
  });
  await Product.insertMany([product1, product2]);

  const orders = [
    new Order({
      organizationId: org._id,
      marketplaceCode: 'amazon',
      marketplaceOrderId: 'ORD-1',
      productId: product1._id,
      orderDate: new Date(),
      status: 'Shipped',
      settlementStatus: 'Settled',
      sellingPrice: 300,
      expectedProfit: 100,
      expectedMargin: 33.3,
      actualGrossRevenue: 300,
      actualProductRevenue: 280,
      actualRefund: 0,
      actualMarketplaceFees: -50,
      actualShipping: -50,
      actualTaxes: 20,
      actualTCS: -1,
      actualAdjustments: 0,
      actualSettlementAmount: 219,
      actualProfit: 80,
      actualMargin: 26.6,
      revenueVariance: 0,
      profitVariance: -20,
      reconciliationStatus: 'Variance'
    }),
    new Order({
      organizationId: org._id,
      marketplaceCode: 'flipkart',
      marketplaceOrderId: 'ORD-2',
      productId: product2._id,
      orderDate: new Date(),
      status: 'Shipped',
      settlementStatus: 'Settled',
      sellingPrice: 600,
      expectedProfit: 50,
      expectedMargin: 8.3,
      actualGrossRevenue: 600,
      actualProductRevenue: 550,
      actualRefund: 0,
      actualMarketplaceFees: -100,
      actualShipping: -100,
      actualTaxes: 50,
      actualTCS: -2,
      actualAdjustments: 0,
      actualSettlementAmount: 398,
      actualProfit: -150, // Loss making
      actualMargin: -25,
      revenueVariance: 0,
      profitVariance: -200,
      reconciliationStatus: 'Variance'
    })
  ];
  await Order.insertMany(orders);

  try {
    // Test 6.1: Executive Dashboard
    const dashboard = await AnalyticsService.getExecutiveDashboard(orgId);
    assert.strictEqual(dashboard.kpi.totalOrders, 2, 'Should count 2 orders');
    assert.strictEqual(dashboard.kpi.actualProfit, -70, 'Profit should be 80 - 150 = -70');
    assert.strictEqual(dashboard.topProducts.length, 1, 'Should have 1 top product');
    assert.strictEqual(dashboard.lossProducts.length, 1, 'Should have 1 loss product');
    console.log('✅ Executive Dashboard analytics passed');

    // Test 6.2: Product Profitability
    const productStats = await AnalyticsService.getProductProfitability(orgId, {});
    assert.strictEqual(productStats.total, 2, 'Should return 2 products');
    const lossProdStats = productStats.data.find(p => p.sku.startsWith('PROD-02'));
    assert.strictEqual(lossProdStats.classification, 'LOSS_MAKING', 'Should classify as loss making');
    console.log('✅ Product Profitability analytics passed');

    // Test 6.3: Marketplace Comparison
    const mpStats = await AnalyticsService.getMarketplaceComparison(orgId, {});
    assert.strictEqual(mpStats.length, 2, 'Should return 2 marketplaces');
    const amz = mpStats.find(m => m.marketplace === 'amazon');
    assert.strictEqual(amz.actualProfit, 80, 'Amazon profit should be 80');
    console.log('✅ Marketplace Comparison passed');

    // Test 6.5: Leakage
    const leakage = await AnalyticsService.getLeakage(orgId, {});
    assert.strictEqual(leakage.length, 4, 'Should return 4 leakage categories');
    console.log('✅ Leakage analytics passed');

    // Test 6.8: Alerts
    const newAlerts = await AlertService.evaluateRules(orgId);
    assert.strictEqual(newAlerts, 2, 'Should create 2 alerts (1 loss product, 1 material variance for ORD-2)');
    
    // Evaluate again should not duplicate
    const dups = await AlertService.evaluateRules(orgId);
    assert.strictEqual(dups, 0, 'Should not create duplicate alerts');
    
    const unread = await AlertService.getAlerts(orgId, 'UNREAD');
    assert.strictEqual(unread.length, 2, 'Should fetch 2 unread alerts');
    console.log('✅ Alert rule engine passed');

    // Test 6.7: Reports
    const reportData = await ReportService.generateReport(orgId, 'marketplaces', {});
    assert.strictEqual(reportData.length, 2, 'Report service should return marketplace data');
    
    // Test CSV Export
    const sampleCsvData = [
      { product: 'Shoes', profit: -50.25, description: 'Red "running" shoes, size 10' },
      { product: 'Hat', profit: 20, description: 'Nice hat' }
    ];
    const csv = jsonToCsv(sampleCsvData);
    assert.ok(csv.includes('product,profit,description'), 'CSV should have headers');
    assert.ok(csv.includes('-50.25'), 'CSV should preserve negative numbers');
    assert.ok(csv.includes('"Red ""running"" shoes, size 10"'), 'CSV should escape commas and quotes');
    console.log('✅ CSV Export formatting passed');
    console.log('✅ Report architecture passed');

    console.log('--- ALL PHASE 6 TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Phase 6 Test Failed:', err);
    process.exit(1);
  } finally {
    await Organization.findByIdAndDelete(org._id);
    await Product.deleteMany({ organizationId: org._id });
    await Order.deleteMany({ organizationId: org._id });
    await Alert.deleteMany({ organizationId: org._id });
    process.exit(0);
  }
};

runTest();
