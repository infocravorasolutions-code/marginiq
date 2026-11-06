import mongoose, { Document, Schema } from 'mongoose';

export interface IExportJob extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportType: string;
  format: string;
  filters: any;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  progress?: number;
  rowCount?: number;
  fileName?: string;
  errorMessage?: string;
  completedAt?: Date;
  expiresAt?: Date;
}

const ExportJobSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    format: { type: String, required: true },
    filters: { type: Schema.Types.Mixed },
    status: { 
      type: String, 
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'], 
      default: 'QUEUED' 
    },
    progress: { type: Number, default: 0 },
    rowCount: { type: Number },
    fileName: { type: String },
    errorMessage: { type: String },
    completedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ExportJobSchema.index({ organizationId: 1, userId: 1 });
ExportJobSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model<IExportJob>('ExportJob', ExportJobSchema);
