import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedProduct extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId | string; // Could be internal or external ID
  productName?: string;
  status: 'Researching' | 'Potential' | 'Sourcing' | 'Testing' | 'Launched' | 'Rejected';
  notes: string;
  assumptions: {
    productCost: number;
    shipping: number;
    advertisingPercent: number;
    returnPercent: number;
  };
  calculatedScore: number;
  calculatedMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

const SavedProductSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.Mixed, required: true },
    productName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Researching', 'Potential', 'Sourcing', 'Testing', 'Launched', 'Rejected'],
      default: 'Researching',
    },
    notes: { type: String, default: '' },
    assumptions: {
      productCost: { type: Number, required: true },
      shipping: { type: Number, required: true },
      advertisingPercent: { type: Number, default: 5 },
      returnPercent: { type: Number, default: 10 },
    },
    calculatedScore: { type: Number },
    calculatedMargin: { type: Number },
  },
  { timestamps: true }
);

SavedProductSchema.index({ userId: 1, productId: 1 }, { unique: true });
SavedProductSchema.index({ organizationId: 1 });

export default mongoose.model<ISavedProduct>('SavedProduct', SavedProductSchema);
