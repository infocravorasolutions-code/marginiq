import mongoose, { Document, Schema } from 'mongoose';

export interface IProductBatch extends Document {
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  batchNumber: string;
  supplierId?: mongoose.Types.ObjectId;
  purchaseId?: mongoose.Types.ObjectId;
  
  initialQuantity: number;
  remainingQuantity: number;
  
  purchaseCost: number;
  packagingCost: number;
  labelCost: number;
  inboundShipping: number;
  inspectionCost: number;
  importCost: number;
  otherProcurementCost: number;
  landedCost: number;

  receivedDate: Date;
  status: 'Active' | 'Exhausted';
  
  createdAt: Date;
  updatedAt: Date;
}

const ProductBatchSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    batchNumber: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase' },
    
    initialQuantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    
    purchaseCost: { type: Number, required: true, default: 0 },
    packagingCost: { type: Number, default: 0 },
    labelCost: { type: Number, default: 0 },
    inboundShipping: { type: Number, default: 0 },
    inspectionCost: { type: Number, default: 0 },
    importCost: { type: Number, default: 0 },
    otherProcurementCost: { type: Number, default: 0 },
    landedCost: { type: Number, required: true, default: 0 },

    receivedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Exhausted'], default: 'Active' },
  },
  { timestamps: true }
);

ProductBatchSchema.index({ organizationId: 1, productId: 1 });
ProductBatchSchema.index({ organizationId: 1, batchNumber: 1 });

export default mongoose.model<IProductBatch>('ProductBatch', ProductBatchSchema);
