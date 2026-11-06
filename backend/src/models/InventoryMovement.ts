import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryMovement extends Document {
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  movementType: 'Purchase' | 'Sale' | 'Return' | 'Damage' | 'Loss' | 'Adjustment' | 'Transfer' | 'Reserved' | 'Released' | 'Recovered Return';
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  userId?: mongoose.Types.ObjectId;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    movementType: {
      type: String,
      required: true,
      enum: [
        'Purchase', 'Sale', 'Return', 'Damage', 'Loss', 
        'Adjustment', 'Transfer', 'Reserved', 'Released', 'Recovered Return'
      ],
    },
    unitCost: { type: Number, required: true, default: 0 },
    totalCost: { type: Number, required: true, default: 0 },
    referenceType: { type: String }, // e.g. "Order", "PurchaseOrder", "Return"
    referenceId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InventoryMovementSchema.index({ organizationId: 1, productId: 1 });
InventoryMovementSchema.index({ organizationId: 1, timestamp: -1 });

export default mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
