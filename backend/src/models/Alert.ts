import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  organizationId: Types.ObjectId;
  type: string; // LOW_MARGIN, LOSS_MAKING_PRODUCT, PROFIT_DROP, SETTLEMENT_VARIANCE, etc.
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  entityType?: 'Product' | 'Order' | 'SettlementImport' | 'System';
  entityId?: string;
  metric?: string;
  threshold?: number;
  actualValue?: number;
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityType: { type: String, enum: ['Product', 'Order', 'SettlementImport', 'System'] },
    entityId: { type: String },
    metric: { type: String },
    threshold: { type: Number },
    actualValue: { type: Number },
    status: { type: String, enum: ['UNREAD', 'READ', 'RESOLVED'], default: 'UNREAD', index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

AlertSchema.index({ organizationId: 1, type: 1, entityId: 1 }, { unique: true, partialFilterExpression: { status: 'UNREAD' } });
AlertSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);
