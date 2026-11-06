import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  organizationId: mongoose.Types.ObjectId;
  purchaseOrderNumber: string;
  invoiceNumber?: string;
  supplierId?: mongoose.Types.ObjectId;
  status: 'Draft' | 'Ordered' | 'Shipped' | 'Received' | 'Cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  items: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;

  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  otherCosts: number;
  totalAmount: number;
  
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    purchaseOrderNumber: { type: String, required: true },
    invoiceNumber: { type: String },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    status: { 
      type: String, 
      enum: ['Draft', 'Ordered', 'Shipped', 'Received', 'Cancelled'], 
      default: 'Draft' 
    },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      unitCost: { type: Number, required: true },
      totalCost: { type: Number, required: true }
    }],

    subtotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    otherCosts: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    
    paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    notes: { type: String },
  },
  { timestamps: true }
);

PurchaseSchema.index({ organizationId: 1, purchaseOrderNumber: 1 }, { unique: true });
PurchaseSchema.index({ organizationId: 1, supplierId: 1 });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
