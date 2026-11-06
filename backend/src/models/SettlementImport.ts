import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlementImport extends Document {
  organizationId: mongoose.Types.ObjectId;
  marketplaceCode: string;
  originalFileName: string;
  importDate: Date;
  
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  
  errorLog?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const SettlementImportSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    marketplaceCode: { type: String, required: true },
    originalFileName: { type: String, required: true },
    importDate: { type: Date, default: Date.now },
    
    status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
    
    totalRows: { type: Number, default: 0 },
    successfulRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    
    errorLog: { type: String },
  },
  { timestamps: true }
);

SettlementImportSchema.index({ organizationId: 1, importDate: -1 });

export default mongoose.model<ISettlementImport>('SettlementImport', SettlementImportSchema);
