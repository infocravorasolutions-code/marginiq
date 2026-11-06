import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import Organization from '../src/models/Organization';
import User from '../src/models/User';
import ScheduledReport from '../src/models/ScheduledReport';
import ReportHistory from '../src/models/ReportHistory';
import ExportJob from '../src/models/ExportJob';
import Notification from '../src/models/Notification';
import AuditLog from '../src/models/AuditLog';
import Comment from '../src/models/Comment';

import { ReportScheduleService } from '../src/services/reports/ReportScheduleService';
import { ExportJobService } from '../src/services/reports/ExportJobService';
import { CommentService } from '../src/services/CommentService';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING PHASE 7 TESTS ---');
  await connectDB();

  // 1. Setup Data
  const org = new Organization({ name: 'Phase 7 Test Org', industry: 'Retail' });
  await org.save();
  const orgId = org._id.toString();

  const user = new User({
    organizationId: org._id,
    email: `test7_${Date.now()}@example.com`,
    passwordHash: 'dummy',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN'
  });
  await user.save();
  const userId = user._id.toString();

  try {
    // 7.1 Scheduled Report Creation & Execution
    const schedule = await ReportScheduleService.createSchedule(orgId, userId, {
      name: 'Daily Marketplaces',
      reportType: 'marketplaces',
      format: 'csv',
      filters: {},
      frequency: 'DAILY',
      time: '09:00',
      timezone: 'UTC'
    });
    assert.ok(schedule._id, 'Schedule should be created');

    const result = await ReportScheduleService.runSchedule(schedule._id.toString(), orgId, userId);
    assert.strictEqual(result.success, true, 'Schedule should run successfully');

    const history = await ReportHistory.find({ organizationId: orgId });
    assert.strictEqual(history.length, 1, 'Report history should be recorded');
    assert.strictEqual(history[0].reportType, 'marketplaces');

    const notifications = await Notification.find({ organizationId: orgId });
    assert.strictEqual(notifications.length, 1, 'Notification should be created for report ready');
    console.log('✅ Scheduled Reports & Notifications passed');

    // 7.2 Export Jobs
    const job = await ExportJobService.requestExport(orgId, userId, 'orders', 'csv', {});
    assert.strictEqual(job.status, 'COMPLETED', 'Job should complete synchronously in this mocked implementation');
    
    const jobs = await ExportJobService.getJobs(orgId, userId);
    assert.strictEqual(jobs.length, 1, 'Should fetch 1 export job');
    console.log('✅ Export Jobs passed');

    // 7.3 Comments
    const comment = await CommentService.createComment(orgId, userId, 'PRODUCT', 'PROD-123', 'Check margin on this', []);
    assert.strictEqual(comment.body, 'Check margin on this');

    const comments = await CommentService.getComments(orgId, 'PRODUCT', 'PROD-123');
    assert.strictEqual(comments.length, 1, 'Should fetch 1 comment');
    console.log('✅ Comments & Collaboration passed');

    // 7.4 Audit Logs
    const logs = await AuditLog.find({ organizationId: orgId });
    assert.ok(logs.length >= 3, 'Should have multiple audit logs for schedule creation, export, and comment');
    console.log('✅ Audit Logs passed');

    console.log('--- ALL PHASE 7 TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Phase 7 Test Failed:', err);
    process.exit(1);
  } finally {
    await Organization.findByIdAndDelete(org._id);
    await User.findByIdAndDelete(user._id);
    await ScheduledReport.deleteMany({ organizationId: org._id });
    await ReportHistory.deleteMany({ organizationId: org._id });
    await ExportJob.deleteMany({ organizationId: org._id });
    await Notification.deleteMany({ organizationId: org._id });
    await AuditLog.deleteMany({ organizationId: org._id });
    await Comment.deleteMany({ organizationId: org._id });
    process.exit(0);
  }
};

runTest();
