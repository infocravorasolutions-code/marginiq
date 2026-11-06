import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import Organization from '../src/models/Organization';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Order from '../src/models/Order';
import SettlementImport from '../src/models/SettlementImport';
import SettlementTransaction from '../src/models/SettlementTransaction';
import ScheduledReport from '../src/models/ScheduledReport';
import ReportHistory from '../src/models/ReportHistory';
import Alert from '../src/models/Alert';
import Notification from '../src/models/Notification';
import Comment from '../src/models/Comment';
import AuditLog from '../src/models/AuditLog';
import ProductBatch from '../src/models/ProductBatch';
import InventoryMovement from '../src/models/InventoryMovement';

import { ReportScheduleService } from '../src/services/reports/ReportScheduleService';
import { AlertService } from '../src/services/alerts/AlertService';
import { NotificationService } from '../src/services/alerts/NotificationService';
import { CommentService } from '../src/services/CommentService';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING TENANT ISOLATION TESTS ---');
  await connectDB();

  // 1. Create two distinct tenants
  const orgA = new Organization({ name: 'Org A Isolation Test', industry: 'Fashion' });
  await orgA.save();
  const orgAId = orgA._id.toString();

  const orgB = new Organization({ name: 'Org B Isolation Test', industry: 'Electronics' });
  await orgB.save();
  const orgBId = orgB._id.toString();

  const userA = new User({
    organizationId: orgA._id,
    email: `usera_${Date.now()}@test.com`,
    passwordHash: 'dummy',
    firstName: 'User',
    lastName: 'A',
    role: 'ADMIN'
  });
  await userA.save();

  const userB = new User({
    organizationId: orgB._id,
    email: `userb_${Date.now()}@test.com`,
    passwordHash: 'dummy',
    firstName: 'User',
    lastName: 'B',
    role: 'ADMIN'
  });
  await userB.save();

  try {
    console.log('Seeding data for Org A...');

    // 1. Product in Org A
    const prodA = new Product({
      organizationId: orgA._id,
      sku: `SKU-A-${Date.now()}`,
      name: 'Org A Exclusive Product',
      category: 'Clothing',
      dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10, deadWeightKg: 0.5 },
      costSettings: { purchasePrice: 100, landedCost: 110, packagingCost: 10, taxRate: 18 }
    });
    await prodA.save();

    // 2. Order in Org A
    const orderA = new Order({
      organizationId: orgA._id,
      marketplaceCode: 'amazon',
      marketplaceOrderId: `ORD-A-${Date.now()}`,
      productId: prodA._id,
      calculationSnapshotId: new mongoose.Types.ObjectId(),
      orderDate: new Date(),
      status: 'Shipped',
      sellingPrice: 499,
      expectedProfit: 150,
      expectedMargin: 30.06
    });
    await orderA.save();

    // 3. Settlement in Org A
    const setImportA = new SettlementImport({
      organizationId: orgA._id,
      marketplaceCode: 'amazon',
      originalFileName: 'settlement_a.csv',
      status: 'Completed'
    });
    await setImportA.save();

    const setTxA = new SettlementTransaction({
      organizationId: orgA._id,
      importId: setImportA._id,
      marketplaceCode: 'amazon',
      transactionId: `TX-A-${Date.now()}`,
      transactionType: 'Order',
      transactionDate: new Date(),
      netSettlementAmount: 420
    });
    await setTxA.save();

    // 4. Report Schedule & History in Org A
    const scheduleA = await ReportScheduleService.createSchedule(orgAId, userA._id.toString(), {
      name: 'Org A Daily Schedule',
      reportType: 'orders',
      format: 'csv',
      frequency: 'DAILY',
      time: '10:00'
    });

    const reportHistA = new ReportHistory({
      organizationId: orgA._id,
      userId: userA._id,
      reportType: 'orders',
      format: 'csv',
      rowCount: 10,
      fileName: 'report_a.csv'
    });
    await reportHistA.save();

    // 5. Alert in Org A
    const alertA = new Alert({
      organizationId: orgA._id,
      type: 'LOSS_MAKING_PRODUCT',
      severity: 'CRITICAL',
      title: 'Org A Alert',
      message: 'Product margin negative',
      status: 'UNREAD'
    });
    await alertA.save();

    // 6. Notification in Org A
    await NotificationService.createNotification({
      organizationId: orgA._id,
      userId: userA._id,
      type: 'ALERT',
      title: 'Org A Notification',
      message: 'Private notification for User A'
    });

    // 7. Comment in Org A
    await CommentService.createComment(
      orgAId,
      userA._id.toString(),
      'ORDER',
      orderA._id.toString(),
      'Org A confidential note'
    );

    // 8. Audit Log in Org A
    const auditA = new AuditLog({
      organizationId: orgA._id,
      userId: userA._id,
      action: 'ORDER_UPDATED',
      entityType: 'Order',
      entityId: orderA._id.toString()
    });
    await auditA.save();

    // 9. Inventory / Batch in Org A
    const batchA = new ProductBatch({
      organizationId: orgA._id,
      productId: prodA._id,
      batchNumber: 'BATCH-A-01',
      initialQuantity: 100,
      remainingQuantity: 100,
      purchaseCost: 100,
      landedCost: 100
    });
    await batchA.save();

    const movementA = new InventoryMovement({
      organizationId: orgA._id,
      productId: prodA._id,
      movementType: 'Purchase',
      quantity: 100,
      unitCost: 100,
      totalCost: 10000,
      timestamp: new Date(),
      notes: 'Initial inward for Org A'
    });
    await movementA.save();

    console.log('✅ Org A data created.');
    console.log('\n--- VERIFYING TENANT ISOLATION FOR ORG B ---');

    // 1. Products Isolation
    const prodsForB = await Product.find({ organizationId: orgB._id });
    assert.strictEqual(prodsForB.length, 0, 'Org B must not see Org A products');
    const prodADirect = await Product.findOne({ _id: prodA._id, organizationId: orgB._id });
    assert.strictEqual(prodADirect, null, 'Org B query with Org A prod ID must return null');
    console.log('✅ Products Isolation: PASS');

    // 2. Orders Isolation
    const ordersForB = await Order.find({ organizationId: orgB._id });
    assert.strictEqual(ordersForB.length, 0, 'Org B must not see Org A orders');
    const orderADirect = await Order.findOne({ _id: orderA._id, organizationId: orgB._id });
    assert.strictEqual(orderADirect, null, 'Org B query with Org A order ID must return null');
    console.log('✅ Orders Isolation: PASS');

    // 3. Settlements Isolation
    const importsForB = await SettlementImport.find({ organizationId: orgB._id });
    assert.strictEqual(importsForB.length, 0, 'Org B must not see Org A settlement imports');
    const txForB = await SettlementTransaction.find({ organizationId: orgB._id });
    assert.strictEqual(txForB.length, 0, 'Org B must not see Org A settlement transactions');
    console.log('✅ Settlements Isolation: PASS');

    // 4. Reports Isolation
    const schedulesForB = await ReportScheduleService.getSchedules(orgBId);
    assert.strictEqual(schedulesForB.length, 0, 'Org B must not see Org A report schedules');
    const historyForB = await ReportHistory.find({ organizationId: orgB._id });
    assert.strictEqual(historyForB.length, 0, 'Org B must not see Org A report history');
    console.log('✅ Reports Isolation: PASS');

    // 5. Alerts Isolation
    const alertsForB = await AlertService.getAlerts(orgBId);
    assert.strictEqual(alertsForB.length, 0, 'Org B must not see Org A alerts');
    console.log('✅ Alerts Isolation: PASS');

    // 6. Notifications Isolation
    const notifsForB = await NotificationService.getNotifications(userB._id.toString(), orgBId);
    assert.strictEqual(notifsForB.length, 0, 'Org B must not see Org A notifications');
    console.log('✅ Notifications Isolation: PASS');

    // 7. Users Isolation
    const usersForB = await User.find({ organizationId: orgB._id });
    assert.strictEqual(usersForB.length, 1, 'Org B must only see User B');
    assert.strictEqual(usersForB[0]._id.toString(), userB._id.toString(), 'Org B user must be User B');
    const userAFromB = await User.findOne({ _id: userA._id, organizationId: orgB._id });
    assert.strictEqual(userAFromB, null, 'Org B must not access User A');
    console.log('✅ Users Isolation: PASS');

    // 8. Comments Isolation
    const commentsForB = await CommentService.getComments(orgBId, 'ORDER', orderA._id.toString());
    assert.strictEqual(commentsForB.length, 0, 'Org B must not see Org A comments');
    console.log('✅ Comments Isolation: PASS');

    // 9. Audit Logs Isolation
    const auditForB = await AuditLog.find({ organizationId: orgB._id });
    assert.strictEqual(auditForB.length, 0, 'Org B must not see Org A audit logs');
    console.log('✅ Audit Logs Isolation: PASS');

    // 10. Inventory Isolation
    const batchesForB = await ProductBatch.find({ organizationId: orgB._id });
    assert.strictEqual(batchesForB.length, 0, 'Org B must not see Org A product batches');
    const movementsForB = await InventoryMovement.find({ organizationId: orgB._id });
    assert.strictEqual(movementsForB.length, 0, 'Org B must not see Org A inventory movements');
    console.log('✅ Inventory Isolation: PASS');

    console.log('\n--- ALL TENANT ISOLATION TESTS PASSED (10/10) ---');
  } finally {
    // Cleanup
    await Product.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Order.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await SettlementImport.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await SettlementTransaction.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await ScheduledReport.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await ReportHistory.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Alert.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Notification.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Comment.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await AuditLog.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await ProductBatch.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await InventoryMovement.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await User.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });
  }
};

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Tenant Isolation Failed:', err);
    process.exit(1);
  });
