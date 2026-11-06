import mongoose, { Document, Schema } from 'mongoose';

export interface IReportHistory extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportType: string;
  filters: any;
  format: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  fileName?: string;
  rowCount?: number;
  generatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  expiresAt?: Date;
}

const ReportHistorySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    filters: { type: Schema.Types.Mixed },
    format: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'], 
      default: 'QUEUED' 
    },
    fileName: { type: String },
    rowCount: { type: Number },
    generatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    errorMessage: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ReportHistorySchema.index({ organizationId: 1, generatedAt: -1 });
ReportHistorySchema.index({ organizationId: 1, userId: 1 });
ReportHistorySchema.index({ organizationId: 1, status: 1 });

export default mongoose.model<IReportHistory>('ReportHistory', ReportHistorySchema);
