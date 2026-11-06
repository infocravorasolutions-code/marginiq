import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlementTransaction extends Document {
  organizationId: mongoose.Types.ObjectId;
  importId: mongoose.Types.ObjectId;
  marketplaceCode: string;
  
  marketplaceOrderId?: string; // e.g. Amazon Order ID 408-1234567-8901234
  transactionId: string; // The unique settlement ID from the marketplace
  
  transactionType: 'Order' | 'Refund' | 'Adjustment' | 'ServiceFee' | 'Other';
  transactionDate: Date;
  
  // Broken down financial amounts (actuals)
  principalAmount: number; // Revenue
  totalMarketplaceFees: number;
  taxLiable: number; // Output GST/Sales Tax
  tcsAmount: number; // Tax Collected at Source
  totalTaxes: number; // Net tax (taxLiable + tcsAmount)
  totalShipping: number;
  otherDeductions: number;
  
  netSettlementAmount: number; // The actual cash paid out to the seller
  
  reconciliationStatus: 'Matched' | 'Unmatched' | 'Disputed' | 'Ignored';
  matchedOrderId?: mongoose.Types.ObjectId;
  matchMethod?: string;
  matchConfidence: 'High' | 'Medium' | 'Low' | 'Unmatched';
  
  rawTransactionData: any; // Store the original row as JSON for auditability
  
  createdAt: Date;
  updatedAt: Date;
}

const SettlementTransactionSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    importId: { type: Schema.Types.ObjectId, ref: 'SettlementImport', required: true },
    marketplaceCode: { type: String, required: true },
    
    marketplaceOrderId: { type: String, required: false, default: '' },
    transactionId: { type: String, required: true },
    
    transactionType: { type: String, enum: ['Order', 'Refund', 'Adjustment', 'ServiceFee', 'Other'], required: true },
    transactionDate: { type: Date, required: true },
    
    principalAmount: { type: Number, default: 0 },
    totalMarketplaceFees: { type: Number, default: 0 },
    taxLiable: { type: Number, default: 0 },
    tcsAmount: { type: Number, default: 0 },
    totalTaxes: { type: Number, default: 0 },
    totalShipping: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    
    netSettlementAmount: { type: Number, required: true },
    
    reconciliationStatus: { type: String, enum: ['Matched', 'Unmatched', 'Disputed', 'Ignored'], default: 'Unmatched' },
    matchedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    matchMethod: { type: String },
    matchConfidence: { type: String, enum: ['High', 'Medium', 'Low', 'Unmatched'], default: 'Unmatched' },
    
    rawTransactionData: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SettlementTransactionSchema.index({ organizationId: 1, marketplaceOrderId: 1 });
SettlementTransactionSchema.index({ importId: 1 });
SettlementTransactionSchema.index({ organizationId: 1, transactionId: 1 }, { unique: true });

export default mongoose.model<ISettlementTransaction>('SettlementTransaction', SettlementTransactionSchema);
