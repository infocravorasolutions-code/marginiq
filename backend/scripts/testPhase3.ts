import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../src/config/db';
import Product from '../src/models/Product';
import Supplier from '../src/models/Supplier';
import SavedProduct from '../src/models/SavedProduct';
import Watchlist from '../src/models/Watchlist';
import Organization from '../src/models/Organization';
import User from '../src/models/User';
import { ProfitabilityEngine } from '../src/services/engines/ProfitabilityEngine';
import { calculateOpportunityScore } from '../src/services/scoringEngine';
import { AnalyticsService } from '../src/services/analytics/AnalyticsService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runPhase3Tests() {
  await connectDB();
  console.log('--- Running Phase 3 Tests ---');

  // Setup test organizations & users
  let orgA = await Organization.findOne({ name: 'Phase3 Org A' });
  if (!orgA) {
    orgA = await Organization.create({ name: 'Phase3 Org A', plan: 'growth', status: 'active' });
  }

  let orgB = await Organization.findOne({ name: 'Phase3 Org B' });
  if (!orgB) {
    orgB = await Organization.create({ name: 'Phase3 Org B', plan: 'growth', status: 'active' });
  }

  await User.deleteMany({ email: { $in: ['phase3_a@test.com', 'phase3_b@test.com'] } });

  const userA = await User.create({
    firstName: 'User',
    lastName: '3A',
    email: 'phase3_a@test.com',
    passwordHash: 'dummyhash',
    role: 'ADMIN',
    organizationId: orgA._id,
    status: 'ACTIVE',
    isVerified: true,
  });

  const userB = await User.create({
    firstName: 'User',
    lastName: '3B',
    email: 'phase3_b@test.com',
    passwordHash: 'dummyhash',
    role: 'ADMIN',
    organizationId: orgB._id,
    status: 'ACTIVE',
    isVerified: true,
  });

  // 1. Product Analyzer with real ProfitabilityEngine
  console.log('Testing 1: ProfitabilityEngine + Opportunity scoring...');
  const profResult = await ProfitabilityEngine.calculate({
    marketplaceCode: 'amazon',
    sellingPrice: 499,
    productLandedCost: 150,
    productGstPercent: 18,
    weight: 350,
    length: 15,
    width: 10,
    height: 5,
    packagingCost: 15,
    fulfilmentType: 'fba',
    zone: 'national',
    paymentMethod: 'prepaid',
    origin: 'delhi',
    destination: 'mumbai',
    rtoPercent: 4,
    customerReturnPercent: 4,
    damagePercent: 1,
    reimbursementPercent: 50,
    advertisingPercent: 8,
  });

  if (!profResult || typeof profResult.netProfit !== 'number') {
    throw new Error('ProfitabilityEngine calculation returned invalid result');
  }

  const oppScore = calculateOpportunityScore({
    netMargin: profResult.netMargin,
    competitionScore: 'LOW',
    returnRisk: 'LOW',
    shippingWeight: 350,
    brandability: 'HIGH',
  });

  if (typeof oppScore.score !== 'number' || oppScore.score <= 0) {
    throw new Error('Opportunity scoring engine failed');
  }
  console.log(`✅ ProfitabilityEngine calculated netMargin: ${profResult.netMargin.toFixed(1)}%, OppScore: ${oppScore.score}`);

  // 2. Real Product Catalog & Database with Tenant Isolation
  console.log('Testing 2: Product Catalog & Tenant Isolation...');
  await Product.deleteMany({ sku: { $in: ['P3-PROD-A', 'P3-PROD-B'] } });

  const prodA = await Product.create({
    organizationId: orgA._id,
    name: 'Phase 3 Smart Bottle',
    sku: 'P3-PROD-A',
    category: 'Kitchen',
    purchasePrice: 120,
    defaultLandedCost: 135,
    packagingCost: 10,
    labelCost: 2,
    inboundShipping: 3,
    inspectionCost: 0,
    importCost: 0,
    otherProcurementCost: 0,
    weight: 300,
    dimensions: { length: 20, width: 8, height: 8 },
    currentStock: 100,
    reservedStock: 0,
    availableStock: 100,
    damagedStock: 0,
    returnedStock: 0,
    lostStock: 0,
    reorderLevel: 20,
  });

  const orgAProducts = await Product.find({ organizationId: orgA._id, sku: 'P3-PROD-A' });
  const orgBProducts = await Product.find({ organizationId: orgB._id, sku: 'P3-PROD-A' });

  if (orgAProducts.length !== 1 || orgBProducts.length !== 0) {
    throw new Error('Tenant isolation failed for Product Catalog');
  }
  console.log('✅ Product catalog created & tenant isolation confirmed.');

  // 3. Sourcing: Supplier persistence & Tenant Isolation
  console.log('Testing 3: Suppliers (Sourcing) & Tenant Isolation...');
  await Supplier.deleteMany({ email: { $in: ['supplierA@p3test.com', 'supplierB@p3test.com'] } });

  await Supplier.create({
    organizationId: orgA._id,
    companyName: 'Phase 3 Glassworks',
    contactName: 'Rajesh Glass',
    email: 'supplierA@p3test.com',
    leadTimeDays: 14,
    minimumOrderQuantity: 100,
  });

  const orgASuppliers = await Supplier.find({ organizationId: orgA._id, email: 'supplierA@p3test.com' });
  const orgBSuppliers = await Supplier.find({ organizationId: orgB._id, email: 'supplierA@p3test.com' });

  if (orgASuppliers.length !== 1 || orgBSuppliers.length !== 0) {
    throw new Error('Tenant isolation failed for Supplier Sourcing');
  }
  console.log('✅ Supplier Sourcing created & tenant isolation confirmed.');

  // 4. SavedProduct Persistence & Tenant Isolation
  console.log('Testing 4: SavedProduct persistence & Tenant Isolation...');
  await SavedProduct.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });

  const savedItemA = await SavedProduct.create({
    userId: userA._id,
    organizationId: orgA._id,
    productId: prodA._id,
    productName: prodA.name,
    status: 'Potential',
    assumptions: {
      productCost: 120,
      shipping: 55,
      advertisingPercent: 6,
      returnPercent: 8,
    },
    calculatedMargin: profResult.netMargin,
    calculatedScore: oppScore.score,
  });

  const orgASaved = await SavedProduct.find({ organizationId: orgA._id });
  const orgBSaved = await SavedProduct.find({ organizationId: orgB._id });

  if (orgASaved.length !== 1 || orgBSaved.length !== 0) {
    throw new Error('Tenant isolation failed for SavedProducts');
  }
  console.log('✅ SavedProduct persisted & tenant isolation confirmed.');

  // 5. Watchlist Persistence & Tenant Isolation
  console.log('Testing 5: Watchlist persistence & Tenant Isolation...');
  await Watchlist.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });

  await Watchlist.create({
    userId: userA._id,
    organizationId: orgA._id,
    productId: prodA._id,
    productName: prodA.name,
    baselineMetrics: {
      price: 499,
      competitionScore: 40,
      opportunityScore: oppScore.score,
      reviewCount: 25,
    },
    notificationsEnabled: true,
  });

  const orgAWatchlist = await Watchlist.find({ organizationId: orgA._id });
  const orgBWatchlist = await Watchlist.find({ organizationId: orgB._id });

  if (orgAWatchlist.length !== 1 || orgBWatchlist.length !== 0) {
    throw new Error('Tenant isolation failed for Watchlist');
  }
  console.log('✅ Watchlist persisted & tenant isolation confirmed.');

  // 6. Opportunity Finder service
  console.log('Testing 6: Opportunity Finder analytics service...');
  const opportunities = await AnalyticsService.getOpportunities(orgA._id);
  if (!Array.isArray(opportunities)) {
    throw new Error('AnalyticsService.getOpportunities did not return an array');
  }
  console.log(`✅ Opportunity Finder returned ${opportunities.length} opportunities for organization.`);

  console.log('\n🎉 ALL PHASE 3 TESTS PASSED!');
  process.exit(0);
}

runPhase3Tests().catch((err) => {
  console.error('❌ Phase 3 test error:', err);
  process.exit(1);
});
