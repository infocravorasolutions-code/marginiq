import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketplaceFeeRule extends Document {
  marketplaceId: mongoose.Types.ObjectId;
  marketplaceCode: string;
  categoryId?: mongoose.Types.ObjectId; 
  categoryPath?: string;
  
  feeType: string; // e.g., 'referral', 'closing', 'shipping', 'collection', 'fixed', 'commission'
  
  // Specificity / Matching dimensions
  fulfilmentType?: string; // 'FBA', 'Easy Ship', 'Self Ship', 'FBF', 'NFBF'
  sellerTier?: string; 
  zone?: string; // 'Local', 'Zonal', 'National'
  paymentMethod?: string; // 'Prepaid', 'COD'
  
  priceMin?: number;
  priceMax?: number;
  weightMin?: number; // in grams
  weightMax?: number; // in grams
  
  // Rule Values
  calculationMethod: 'percentage' | 'fixed' | 'perKg' | 'perOrder' | 'perUnit' | 'tiered' | 'formula';
  percentage?: number;
  fixedAmount?: number;
  perKgAmount?: number;
  perOrderAmount?: number;
  formula?: string;
  
  // Versioning
  effectiveFrom: Date;
  effectiveUntil?: Date; 
  version: number;
  
  // Traceability
  source: string;
  sourceUrl?: string;
  confidence: 'Verified' | 'High' | 'Medium' | 'Estimated' | 'User Provided';
  
  status: 'Active' | 'Inactive' | 'Draft';
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceFeeRuleSchema: Schema = new Schema(
  {
    marketplaceId: { type: Schema.Types.ObjectId, ref: 'Marketplace', required: true },
    marketplaceCode: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory' },
    categoryPath: { type: String },
    
    feeType: { type: String, required: true },
    
    fulfilmentType: { type: String },
    sellerTier: { type: String },
    zone: { type: String },
    paymentMethod: { type: String },
    
    priceMin: { type: Number },
    priceMax: { type: Number },
    weightMin: { type: Number },
    weightMax: { type: Number },
    
    calculationMethod: { 
      type: String, 
      enum: ['percentage', 'fixed', 'perKg', 'perOrder', 'perUnit', 'tiered', 'formula'],
      required: true 
    },
    percentage: { type: Number },
    fixedAmount: { type: Number },
    perKgAmount: { type: Number },
    perOrderAmount: { type: Number },
    formula: { type: String },
    
    effectiveFrom: { type: Date, required: true },
    effectiveUntil: { type: Date },
    version: { type: Number, required: true, default: 1 },
    
    source: { type: String, required: true },
    sourceUrl: { type: String },
    confidence: { 
      type: String, 
      enum: ['Verified', 'High', 'Medium', 'Estimated', 'User Provided'],
      required: true 
    },
    
    status: { type: String, enum: ['Active', 'Inactive', 'Draft'], default: 'Active' },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for fast resolution
MarketplaceFeeRuleSchema.index({ marketplaceId: 1, feeType: 1, status: 1 });
MarketplaceFeeRuleSchema.index({ effectiveFrom: 1, effectiveUntil: 1 });

export default mongoose.model<IMarketplaceFeeRule>('MarketplaceFeeRule', MarketplaceFeeRuleSchema);
