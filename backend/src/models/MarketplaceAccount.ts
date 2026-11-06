import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketplaceAccount extends Document {
  organizationId: mongoose.Types.ObjectId;
  marketplaceCode: 'amazon' | 'flipkart' | 'meesho' | 'd2c';
  accountName: string;
  sellerId?: string;
  marketplaceId?: string;
  status: 'Active' | 'Inactive' | 'Error' | 'Pending';
  authType: 'SP_API' | 'API_KEY' | 'TOKEN' | 'MANUAL_CSV';
  credentials?: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    apiKey?: string;
    webhookSecret?: string;
  };
  lastSyncAt?: Date;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  syncErrorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceAccountSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    marketplaceCode: {
      type: String,
      enum: ['amazon', 'flipkart', 'meesho', 'd2c'],
      required: true
    },
    accountName: { type: String, required: true },
    sellerId: { type: String },
    marketplaceId: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Error', 'Pending'],
      default: 'Active'
    },
    authType: {
      type: String,
      enum: ['SP_API', 'API_KEY', 'TOKEN', 'MANUAL_CSV'],
      default: 'MANUAL_CSV'
    },
    credentials: {
      type: {
        clientId: { type: String },
        clientSecret: { type: String },
        refreshToken: { type: String },
        accessToken: { type: String },
        apiKey: { type: String },
        webhookSecret: { type: String }
      },
      select: false // Never return secrets to frontend by default
    },
    lastSyncAt: { type: Date },
    syncStatus: {
      type: String,
      enum: ['IDLE', 'SYNCING', 'SUCCESS', 'FAILED'],
      default: 'IDLE'
    },
    syncErrorMessage: { type: String }
  },
  { timestamps: true }
);

MarketplaceAccountSchema.index({ organizationId: 1, marketplaceCode: 1 });
MarketplaceAccountSchema.index({ organizationId: 1, accountName: 1 });

export default mongoose.model<IMarketplaceAccount>('MarketplaceAccount', MarketplaceAccountSchema);
