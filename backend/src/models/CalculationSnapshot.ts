import mongoose, { Document, Schema } from 'mongoose';

export interface ICalculationSnapshot extends Document {
  organizationId: mongoose.Types.ObjectId;
  marketplaceCode: string;
  calculationDate: Date;
  
  // Breakdown of calculation
  sellingPrice: number;
  productLandedCost: number;
  
  fees: any;
  shipping: any;
  returns: any;
  damage: any;
  advertising: any;
  discounts: any;
  tax: any;
  
  totalCost: number;
  expectedProfit: number;
  expectedMargin: number;

  feeRuleVersionsApplied: mongoose.Types.ObjectId[];
  calculationVersion: string;
  productId?: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  exchangeRate?: number;
  source?: string;
  confidence?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const CalculationSnapshotSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    marketplaceCode: { type: String, required: true },
    calculationDate: { type: Date, default: Date.now },
    
    sellingPrice: { type: Number, required: true },
    productLandedCost: { type: Number, required: true },
    
    // Stored as JSON objects to preserve the exact nested calculation at that point in time
    fees: { type: Schema.Types.Mixed },
    shipping: { type: Schema.Types.Mixed },
    returns: { type: Schema.Types.Mixed },
    damage: { type: Schema.Types.Mixed },
    advertising: { type: Schema.Types.Mixed },
    discounts: { type: Schema.Types.Mixed },
    tax: { type: Schema.Types.Mixed },
    
    totalCost: { type: Number, required: true },
    expectedProfit: { type: Number, required: true },
    expectedMargin: { type: Number, required: true },

    feeRuleVersionsApplied: [{ type: Schema.Types.ObjectId, ref: 'FeeRuleVersion' }],
    calculationVersion: { type: String, required: true, default: '1.0' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    exchangeRate: { type: Number },
    source: { type: String },
    confidence: { type: String },
  },
  { timestamps: true }
);

CalculationSnapshotSchema.index({ organizationId: 1, marketplaceCode: 1 });

export default mongoose.model<ICalculationSnapshot>('CalculationSnapshot', CalculationSnapshotSchema);
