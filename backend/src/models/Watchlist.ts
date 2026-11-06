import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchlist extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId | string;
  productName?: string;
  baselineMetrics: {
    price: number;
    competitionScore: number;
    opportunityScore: number;
    reviewCount: number;
  };
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.Mixed, required: true },
    productName: { type: String, default: '' },
    baselineMetrics: {
      price: { type: Number },
      competitionScore: { type: Number },
      opportunityScore: { type: Number },
      reviewCount: { type: Number },
    },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WatchlistSchema.index({ organizationId: 1 });

export default mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);
