import mongoose, { Document, Schema } from 'mongoose';

export interface IProductSupplier extends Document {
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  supplierSku?: string;
  purchasePrice: number;
  moq: number;
  leadTimeDays: number;
  gstRate?: number;
  packagingInfo?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSupplierSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierSku: { type: String },
    purchasePrice: { type: Number, required: true },
    moq: { type: Number, default: 1 },
    leadTimeDays: { type: Number, default: 7 },
    gstRate: { type: Number, default: 18 },
    packagingInfo: { type: String },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String }
  },
  { timestamps: true }
);

ProductSupplierSchema.index({ organizationId: 1, productId: 1, supplierId: 1 }, { unique: true });
ProductSupplierSchema.index({ organizationId: 1, supplierId: 1 });

export default mongoose.model<IProductSupplier>('ProductSupplier', ProductSupplierSchema);
