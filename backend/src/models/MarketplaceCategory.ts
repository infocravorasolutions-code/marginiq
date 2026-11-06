import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketplaceCategory extends Document {
  marketplaceId: mongoose.Types.ObjectId;
  name: string;
  path: string; // e.g., 'Automotive > Cleaning Kits'
  parentCategoryId?: mongoose.Types.ObjectId;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceCategorySchema: Schema = new Schema(
  {
    marketplaceId: { type: Schema.Types.ObjectId, ref: 'Marketplace', required: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

MarketplaceCategorySchema.index({ marketplaceId: 1, path: 1 }, { unique: true });

export default mongoose.model<IMarketplaceCategory>('MarketplaceCategory', MarketplaceCategorySchema);
