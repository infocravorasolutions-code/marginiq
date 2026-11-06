import mongoose, { Document, Schema } from 'mongoose';

export interface IAlertPreference extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  alertType: string;
  enabled: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const AlertPreferenceSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    alertType: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
    emailEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AlertPreferenceSchema.index({ organizationId: 1, userId: 1, alertType: 1 }, { unique: true });

export default mongoose.model<IAlertPreference>('AlertPreference', AlertPreferenceSchema);
