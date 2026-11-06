import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  read: boolean;
  resolved: boolean;
  metadata?: any;
}

const NotificationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, userId: 1, read: 1 });
NotificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
