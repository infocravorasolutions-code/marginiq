import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  hsnCode?: string;
  gstRate?: number;
  description?: string;
  images: string[];
  supplier?: mongoose.Types.ObjectId;
  
  // Costing
  purchasePrice: number;
  defaultLandedCost: number;
  packagingCost: number;
  labelCost: number;
  inboundShipping: number;
  inspectionCost: number;
  importCost: number;
  otherProcurementCost: number;

  // Physical
  weight: number; // in grams
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Inventory
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  damagedStock: number;
  returnedStock: number;
  lostStock: number;
  reorderLevel: number;

  // Pricing Goals
  targetMargin?: number;
  targetRoi?: number;
  costingMethod?: 'WAC' | 'FIFO' | 'BATCH';
  unit?: string;
  status: 'Active' | 'Draft' | 'Archived';
  sellingStatus?: 'Active' | 'Paused' | 'Discontinued' | 'Draft';
  isActive?: boolean;
  notes?: string;
  source?: string;
  confidence?: 'VERIFIED' | 'HIGH' | 'MEDIUM' | 'ESTIMATED' | 'USER_PROVIDED' | 'IMPORTED' | 'CALCULATED';
  costSettings?: {
    purchasePrice?: number;
    landedCost?: number;
    packagingCost?: number;
    taxRate?: number;
  };

  organizationId: mongoose.Types.ObjectId; // Multi-tenant isolation
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String },
    brand: { type: String },
    category: { type: String, required: true },
    subcategory: { type: String },
    hsnCode: { type: String },
    gstRate: { type: Number, default: 18 },
    description: { type: String },
    images: [{ type: String }],
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },

    purchasePrice: { type: Number, required: true, default: 0 },
    defaultLandedCost: { type: Number, required: true, default: 0 },
    packagingCost: { type: Number, default: 0 },
    labelCost: { type: Number, default: 0 },
    inboundShipping: { type: Number, default: 0 },
    inspectionCost: { type: Number, default: 0 },
    importCost: { type: Number, default: 0 },
    otherProcurementCost: { type: Number, default: 0 },

    weight: { type: Number, required: true, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    returnedStock: { type: Number, default: 0 },
    lostStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },

    targetMargin: { type: Number },
    targetRoi: { type: Number },
    status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' },
    sellingStatus: { type: String, enum: ['Active', 'Paused', 'Discontinued', 'Draft'], default: 'Active' },
    isActive: { type: Boolean, default: true },
    costingMethod: { type: String, enum: ['WAC', 'FIFO', 'BATCH'], default: 'WAC' },
    unit: { type: String, default: 'pcs' },
    notes: { type: String },
    source: { type: String, default: 'MANUAL' },
    confidence: { type: String, default: 'USER_PROVIDED' },
    costSettings: {
      purchasePrice: { type: Number },
      landedCost: { type: Number },
      packagingCost: { type: Number },
      taxRate: { type: Number },
    },
    
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', sku: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ organizationId: 1 });
ProductSchema.index({ sku: 1, organizationId: 1 }, { unique: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
