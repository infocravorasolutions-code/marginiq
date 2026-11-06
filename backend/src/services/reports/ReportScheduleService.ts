import ScheduledReport from '../../models/ScheduledReport';
import ReportHistory from '../../models/ReportHistory';
import { AuditService } from '../AuditService';
import { ReportService } from './ReportService';
import { NotificationService } from '../alerts/NotificationService';

export class ReportScheduleService {
  static calculateNextRun(frequency: string, time: string = '09:00', dayOfWeek: number = 1, dayOfMonth: number = 1, fromDate: Date = new Date()): Date {
    const [hours, minutes] = (time || '09:00').split(':').map(Number);
    const next = new Date(fromDate);
    next.setHours(hours || 0, minutes || 0, 0, 0);

    if (frequency === 'DAILY') {
      if (next <= fromDate) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'WEEKLY') {
      const currentDay = next.getDay();
      let daysUntil = (dayOfWeek - currentDay + 7) % 7;
      if (daysUntil === 0 && next <= fromDate) {
        daysUntil = 7;
      }
      next.setDate(next.getDate() + daysUntil);
    } else if (frequency === 'MONTHLY') {
      next.setDate(dayOfMonth || 1);
      if (next <= fromDate) {
        next.setMonth(next.getMonth() + 1);
      }
    } else {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  static async createSchedule(organizationId: string, userId: string, data: any) {
    const nextRun = this.calculateNextRun(data.frequency, data.time, data.dayOfWeek, data.dayOfMonth);
    const schedule = await ScheduledReport.create({
      ...data,
      organizationId,
      createdBy: userId,
      nextRunAt: nextRun
    });
    await AuditService.log(organizationId, userId, 'SCHEDULE_CREATED', 'SCHEDULED_REPORT', schedule._id.toString(), { reportType: data.reportType });
    return schedule;
  }

  static async getSchedules(organizationId: string) {
    return ScheduledReport.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  static async updateSchedule(id: string, organizationId: string, userId: string, data: any) {
    if (data.frequency || data.time || data.dayOfWeek !== undefined || data.dayOfMonth !== undefined) {
      data.nextRunAt = this.calculateNextRun(data.frequency || 'DAILY', data.time, data.dayOfWeek, data.dayOfMonth);
    }
    const schedule = await ScheduledReport.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    );
    await AuditService.log(organizationId, userId, 'SCHEDULE_UPDATED', 'SCHEDULED_REPORT', id, data);
    return schedule;
  }

  static async deleteSchedule(id: string, organizationId: string, userId: string) {
    await ScheduledReport.deleteOne({ _id: id, organizationId });
    await AuditService.log(organizationId, userId, 'SCHEDULE_DELETED', 'SCHEDULED_REPORT', id);
    return true;
  }

  static async runSchedule(id: string, organizationId: string, userId: string) {
    const schedule = await ScheduledReport.findOne({ _id: id, organizationId });
    if (!schedule) throw new Error('Schedule not found');

    const now = new Date();
    schedule.lastRunAt = now;
    schedule.nextRunAt = this.calculateNextRun(schedule.frequency, schedule.time, schedule.dayOfWeek, schedule.dayOfMonth, now);
    await schedule.save();

    try {
      const data = await ReportService.generateReport(organizationId, schedule.reportType, schedule.filters || {});
      let rowCount = 0;
      if (data && (data as any).data && Array.isArray((data as any).data)) {
        rowCount = (data as any).data.length;
      } else if (Array.isArray(data)) {
        rowCount = data.length;
      } else if (data) {
        rowCount = 1;
      }

      await ReportHistory.create({
        organizationId,
        userId: schedule.createdBy,
        reportType: schedule.reportType,
        filters: schedule.filters,
        format: schedule.format,
        status: 'COMPLETED',
        rowCount,
        completedAt: new Date()
      });

      // Send notification
      await NotificationService.createNotification({
        organizationId,
        userId: schedule.createdBy,
        type: 'REPORT_READY',
        title: `Scheduled Report: ${schedule.name}`,
        message: `Your scheduled report for ${schedule.reportType} is ready.`,
        severity: 'INFO',
        entityType: 'SCHEDULED_REPORT',
        entityId: schedule._id as any
      });

      return { success: true, rowCount };
    } catch (err: any) {
      await NotificationService.createNotification({
        organizationId,
        userId: schedule.createdBy,
        type: 'REPORT_FAILED',
        title: `Scheduled Report Failed: ${schedule.name}`,
        message: err.message,
        severity: 'WARNING',
        entityType: 'SCHEDULED_REPORT',
        entityId: schedule._id as any
      });
      throw err;
    }
  }

  private static isProcessing = false;

  static async processDueSchedules() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const now = new Date();
      const dueSchedules = await ScheduledReport.find({
        enabled: true,
        $or: [
          { nextRunAt: { $lte: now } },
          { nextRunAt: { $exists: false } },
          { nextRunAt: null }
        ]
      });

      for (const schedule of dueSchedules) {
        try {
          const nextRun = this.calculateNextRun(schedule.frequency, schedule.time, schedule.dayOfWeek, schedule.dayOfMonth, now);
          schedule.lastRunAt = now;
          schedule.nextRunAt = nextRun;
          await schedule.save();

          await this.runSchedule(schedule._id.toString(), schedule.organizationId.toString(), schedule.createdBy.toString());
        } catch (err: any) {
          console.error(`Error executing schedule ${schedule._id}:`, err.message);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
