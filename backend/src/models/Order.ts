import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  organizationId: mongoose.Types.ObjectId;
  marketplaceCode: string;
  marketplaceOrderId: string; // The ID from Amazon/Flipkart
  productId: mongoose.Types.ObjectId;
  
  orderDate: Date;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'RTO';
  settlementStatus: 'Unsettled' | 'Partially Settled' | 'Settled' | 'Disputed';
  reconciliationStatus: 'Unmatched' | 'Partially Matched' | 'Reconciled' | 'Variance' | 'Disputed';
  
  // High-level financial summary
  sellingPrice: number;
  discountAmount: number;
  
  calculationSnapshotId?: mongoose.Types.ObjectId;
  
  // Profitability Tracking
  expectedProfit: number;
  expectedMargin: number;
  
  // Actuals Aggregated from SettlementTransactions
  actualGrossRevenue: number;
  actualProductRevenue: number;
  actualRefund: number;
  actualMarketplaceFees: number;
  actualShipping: number;
  actualTaxes: number;
  actualTCS: number;
  actualAdjustments: number;
  actualSettlementAmount: number;
  
  actualProfit?: number;
  actualMargin?: number;

  // Variances
  revenueVariance?: number;
  feeVariance?: number;
  shippingVariance?: number;
  taxVariance?: number;
  adjustmentVariance?: number;
  settlementVariance?: number;
  profitVariance?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    marketplaceCode: { type: String, required: true },
    marketplaceOrderId: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    
    orderDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'RTO'], default: 'Pending' },
    settlementStatus: { type: String, enum: ['Unsettled', 'Partially Settled', 'Settled', 'Disputed'], default: 'Unsettled' },
    reconciliationStatus: { type: String, enum: ['Unmatched', 'Partially Matched', 'Reconciled', 'Variance', 'Disputed'], default: 'Unmatched' },
    
    sellingPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    
    calculationSnapshotId: { type: Schema.Types.ObjectId, ref: 'CalculationSnapshot' },
    
    expectedProfit: { type: Number, required: true },
    expectedMargin: { type: Number, required: true },
    
    actualGrossRevenue: { type: Number, default: 0 },
    actualProductRevenue: { type: Number, default: 0 },
    actualRefund: { type: Number, default: 0 },
    actualMarketplaceFees: { type: Number, default: 0 },
    actualShipping: { type: Number, default: 0 },
    actualTaxes: { type: Number, default: 0 },
    actualTCS: { type: Number, default: 0 },
    actualAdjustments: { type: Number, default: 0 },
    actualSettlementAmount: { type: Number, default: 0 },
    
    actualProfit: { type: Number },
    actualMargin: { type: Number },

    revenueVariance: { type: Number },
    feeVariance: { type: Number },
    shippingVariance: { type: Number },
    taxVariance: { type: Number },
    adjustmentVariance: { type: Number },
    settlementVariance: { type: Number },
    profitVariance: { type: Number },
  },
  { timestamps: true }
);

// Unique constraint on marketplaceOrderId per organization
OrderSchema.index({ organizationId: 1, marketplaceCode: 1, marketplaceOrderId: 1 }, { unique: true });
OrderSchema.index({ organizationId: 1, orderDate: -1 });
OrderSchema.index({ organizationId: 1, settlementStatus: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
