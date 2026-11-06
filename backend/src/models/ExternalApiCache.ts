import mongoose, { Document, Schema } from 'mongoose';

export interface IExternalApiCache extends Document {
  provider: 'frankfurter' | 'open_products_facts' | 'open_food_facts' | 'amazon_sp_api' | string;
  endpoint: string;
  requestHash: string;
  response: any;
  retrievedAt: Date;
  expiresAt: Date;
  status: 'SUCCESS' | 'ERROR';
  responseTimeMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExternalApiCacheSchema: Schema = new Schema(
  {
    provider: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    requestHash: { type: String, required: true, index: true },
    response: { type: Schema.Types.Mixed, required: true },
    retrievedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['SUCCESS', 'ERROR'], default: 'SUCCESS' },
    responseTimeMs: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

ExternalApiCacheSchema.index({ provider: 1, requestHash: 1 }, { unique: true });
// TTL index automatically expires documents once expiresAt has passed
ExternalApiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IExternalApiCache>('ExternalApiCache', ExternalApiCacheSchema);
