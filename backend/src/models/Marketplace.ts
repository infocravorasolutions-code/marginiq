import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketplace extends Document {
  name: string;
  code: string; // e.g., 'amazon_in'
  country: string;
  currency: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    country: { type: String, default: 'IN' },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export default mongoose.model<IMarketplace>('Marketplace', MarketplaceSchema);
