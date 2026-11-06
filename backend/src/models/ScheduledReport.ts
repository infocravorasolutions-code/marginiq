import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledReport extends Document {
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  reportType: string;
  filters: any;
  format: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

const ScheduledReportSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    reportType: { type: String, required: true },
    filters: { type: Schema.Types.Mixed },
    format: { type: String, required: true },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    time: { type: String, required: true }, // e.g., '09:00'
    timezone: { type: String, required: true, default: 'UTC' },
    recipients: [{ type: String }],
    enabled: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
  },
  { timestamps: true }
);

ScheduledReportSchema.index({ organizationId: 1, enabled: 1 });

export default mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);
