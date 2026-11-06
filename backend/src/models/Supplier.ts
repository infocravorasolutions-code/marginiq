import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  organizationId: mongoose.Types.ObjectId;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  paymentTerms?: string;
  categories?: string[];
  minimumOrderQuantity: number;
  leadTimeDays: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    companyName: { type: String, required: true },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    gstin: { type: String },
    pan: { type: String },
    paymentTerms: { type: String },
    categories: [{ type: String }],
    leadTimeDays: { type: Number, default: 0 },
    minimumOrderQuantity: { type: Number, default: 1 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String },
  },
  { timestamps: true }
);

SupplierSchema.index({ organizationId: 1 });

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
