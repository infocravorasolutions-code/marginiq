import assert from 'assert';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import { FrankfurterService } from '../src/services/external/FrankfurterService';
import { BarcodeEnrichmentService } from '../src/services/external/BarcodeEnrichmentService';
import { AmazonSpApiAdapter } from '../src/services/external/amazon/AmazonSpApiAdapter';
import { ApiHealthService } from '../src/services/external/ApiHealthService';
import { seedDemoData } from '../src/services/demo/DemoSeedService';
import ExternalApiCache from '../src/models/ExternalApiCache';

dotenv.config();

async function runExternalApiTests() {
  console.log('===============================================================');
  console.log('       MARGINIQ EXTERNAL APIS & INTEGRATION TEST SUITE         ');
  console.log('===============================================================');

  await connectDB();

  // 1. Frankfurter Currency API & Cache
  console.log('\n[TEST 1] Testing Frankfurter Currency API ($2.50 USD to INR)...');
  const fxResult1 = await FrankfurterService.convert(2.50, 'USD', 'INR');
  console.log(`   - Original: $${fxResult1.originalAmount} ${fxResult1.originalCurrency}`);
  console.log(`   - Rate:     ${fxResult1.exchangeRate} (Provider: ${fxResult1.rateProvider})`);
  console.log(`   - Converted:₹${fxResult1.convertedAmount}`);
  console.log(`   - Cached:   ${fxResult1.isCached}`);
  assert.ok(fxResult1.convertedAmount > 0, 'Converted INR amount should be greater than 0');
  assert.strictEqual(fxResult1.targetCurrency, 'INR');

  // Verify second call hits cache
  const fxResult2 = await FrankfurterService.convert(2.50, 'USD', 'INR');
  console.log(`   - Second call cached: ${fxResult2.isCached}`);
  assert.strictEqual(fxResult2.isCached, true, 'Second call must hit cache');
  console.log('✅ Frankfurter Currency Conversion & Caching: PASSED');

  // 2. Barcode Registry Enrichment (Open Products Facts / Open Food Facts)
  console.log('\n[TEST 2] Testing Barcode Enrichment Service...');
  // Test invalid/empty barcode
  const invalidRes = await BarcodeEnrichmentService.lookupBarcode('123');
  assert.strictEqual(invalidRes.found, false, 'Short barcode should fail validation gracefully');

  // Test real GTIN lookup (737628064502 - standard test item)
  console.log('   - Testing GTIN lookup (737628064502)...');
  const barcodeRes = await BarcodeEnrichmentService.lookupBarcode('737628064502');
  console.log(`   - Result found: ${barcodeRes.found}, Source: ${barcodeRes.source}, Confidence: ${barcodeRes.confidence}`);
  if (barcodeRes.found) {
    console.log(`   - Name: ${barcodeRes.name}, Brand: ${barcodeRes.brand}`);
    assert.strictEqual(barcodeRes.confidence, 'IMPORTED');
  } else {
    console.log(`   - Honest message: ${barcodeRes.message}`);
    assert.strictEqual(barcodeRes.confidence, 'UNAVAILABLE');
  }
  console.log('✅ Barcode Enrichment Service: PASSED (Honest source & confidence)');

  // 3. Amazon SP-API Adapter & Honest Status
  console.log('\n[TEST 3] Testing Amazon SP-API Adapter Connection Status...');
  const amzTest = await AmazonSpApiAdapter.testConnection();
  console.log(`   - Status:    ${amzTest.status}`);
  console.log(`   - Connected: ${amzTest.connected}`);
  console.log(`   - Message:   ${amzTest.message}`);
  // In dev without LWA env credentials, it must be honest NOT_CONFIGURED, never fake true!
  assert.strictEqual(amzTest.connected, false, 'Without credentials, connected must be false');
  assert.strictEqual(amzTest.status, 'NOT_CONFIGURED', 'Status must be NOT_CONFIGURED without credentials');
  console.log('✅ Amazon SP-API Adapter: PASSED (Zero fake connectivity)');

  // 4. API Health Diagnostics
  console.log('\n[TEST 4] Testing API Health Diagnostics Service...');
  const healthList = await ApiHealthService.getAllProviderHealth();
  console.log(`   - Providers Monitored: ${healthList.length}`);
  for (const h of healthList) {
    console.log(`     • ${h.name}: Status=${h.status}, Latency=${h.responseTimeMs}ms, Mode=${h.mode}`);
  }
  assert.strictEqual(healthList.length, 4, 'Must monitor 4 external providers');
  console.log('✅ API Health Diagnostics: PASSED');

  // 5. Full Demo Seeding Flow
  console.log('\n[TEST 5] Testing Full Demo Organization Seeding...');
  const demoResult = await seedDemoData();
  console.log(`   - Org ID:    ${demoResult.organizationId}`);
  console.log(`   - Product:   ${demoResult.product.name} (SKU: ${demoResult.product.sku})`);
  console.log(`   - Landed Cost: ₹${demoResult.product.landedCost}`);
  console.log(`   - Supplier:  ${demoResult.supplier.name}`);
  console.log(`   - Order:     ${demoResult.order.marketplaceOrderId} (Expected Profit: ₹${demoResult.order.expectedProfit.toFixed(2)})`);
  console.log(`   - Multi-marketplace comparisons:`);
  console.log(`     • Amazon:   ₹${demoResult.economics.amazonProfit.toFixed(2)}`);
  console.log(`     • Flipkart: ₹${demoResult.economics.flipkartProfit.toFixed(2)}`);
  console.log(`     • Meesho:   ₹${demoResult.economics.meeshoProfit.toFixed(2)}`);
  console.log(`     • D2C:      ₹${demoResult.economics.d2cProfit.toFixed(2)}`);

  assert.strictEqual(demoResult.product.landedCost, 145, 'True Landed Cost must equal ₹145');
  assert.ok(demoResult.economics.amazonProfit > 0, 'Amazon profit should be positive at ₹399');
  console.log('✅ Demo Organization Seeding: PASSED');

  console.log('\n===============================================================');
  console.log('🎉 ALL EXTERNAL APIS & INTEGRATION TESTS PASSED (100%)');
  console.log('===============================================================');
  process.exit(0);
}

runExternalApiTests().catch((err) => {
  console.error('❌ External API Test Failed:', err);
  process.exit(1);
});
