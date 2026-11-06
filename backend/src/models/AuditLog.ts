import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

const AuditLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, action: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
