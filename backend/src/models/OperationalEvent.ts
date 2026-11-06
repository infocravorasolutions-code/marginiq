import mongoose, { Document, Schema } from 'mongoose';

export interface IOperationalEvent extends Document {
  organizationId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  marketplaceOrderId?: string;
  productId: mongoose.Types.ObjectId;
  eventType: 'CUSTOMER_RETURN' | 'RTO' | 'DAMAGE' | 'WEIGHT_DISPUTE' | 'FEE_DISCREPANCY';
  eventDate: Date;
  
  costs: {
    forwardShipping: number;
    reverseShipping: number;
    marketplaceFee: number;
    packagingLoss: number;
    damageDepreciation: number;
    productCost: number;
    repairDisposal: number;
    otherCosts: number;
    totalLoss: number;
  };

  claimStatus: 'NOT_CLAIMED' | 'CLAIMED' | 'REIMBURSED' | 'REJECTED';
  reimbursedAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OperationalEventSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    marketplaceOrderId: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    eventType: {
      type: String,
      enum: ['CUSTOMER_RETURN', 'RTO', 'DAMAGE', 'WEIGHT_DISPUTE', 'FEE_DISCREPANCY'],
      required: true
    },
    eventDate: { type: Date, default: Date.now },

    costs: {
      forwardShipping: { type: Number, default: 0 },
      reverseShipping: { type: Number, default: 0 },
      marketplaceFee: { type: Number, default: 0 },
      packagingLoss: { type: Number, default: 0 },
      damageDepreciation: { type: Number, default: 0 },
      productCost: { type: Number, default: 0 },
      repairDisposal: { type: Number, default: 0 },
      otherCosts: { type: Number, default: 0 },
      totalLoss: { type: Number, required: true, default: 0 }
    },

    claimStatus: {
      type: String,
      enum: ['NOT_CLAIMED', 'CLAIMED', 'REIMBURSED', 'REJECTED'],
      default: 'NOT_CLAIMED'
    },
    reimbursedAmount: { type: Number, default: 0 },
    notes: { type: String }
  },
  { timestamps: true }
);

OperationalEventSchema.index({ organizationId: 1, eventType: 1 });
OperationalEventSchema.index({ organizationId: 1, orderId: 1 });
OperationalEventSchema.index({ organizationId: 1, productId: 1 });

export default mongoose.model<IOperationalEvent>('OperationalEvent', OperationalEventSchema);
