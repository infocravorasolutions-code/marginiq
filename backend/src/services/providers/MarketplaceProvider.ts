export interface FeeCalculationInput {
  marketplaceCode: string;
  categoryId?: string;
  sellingPrice: number;
  fulfilmentType?: string;
  sellerTier?: string;
  zone?: string;
  paymentMethod?: string;
  weight?: number; // in grams
  date?: Date;
}

export interface ShippingInput {
  actualWeight: number; // in grams
  length: number;
  width: number;
  height: number;
  origin: string;
  destination: string;
  zone: string;
  fulfilmentType: string;
  marketplaceCode: string;
}

export interface ReturnInput {
  returnRate: number;
  originalShipping: number;
  returnShipping: number;
  marketplaceReturnFee: number;
  repackagingCost: number;
  damageLoss: number;
}

export interface SettlementInput {
  orderId: string;
  // Details depending on marketplace APIs
}

export interface PriceInput {
  targetMargin?: number;
  targetProfit?: number;
  productCost: number;
  // plus all logistics info
}

export interface FeeComponent {
  name: string;
  amount: number;
  ruleId?: string;
  ruleVersion?: number;
  source?: string;
  calculationMethod?: string;
  status?: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface FeeBreakdown {
  totalMarketplaceFees: number;
  components: FeeComponent[];
}

export interface ShippingBreakdown {
  chargeableWeight: number;
  volumetricWeight: number;
  totalShippingCost: number;
  components: FeeComponent[];
}

export interface PriceRecommendation {
  minimumPrice: number;
  safePrice: number;
  recommendedPrice: number;
  aggressivePrice: number;
}

export interface MarketplaceProvider {
  calculateFees(input: FeeCalculationInput): Promise<FeeBreakdown>;
  calculateShipping(input: ShippingInput): Promise<ShippingBreakdown>;
  calculateReturns(input: ReturnInput): Promise<number>;
  calculateSettlement(input: SettlementInput): Promise<any>;
  getRecommendedPrice(input: PriceInput): Promise<PriceRecommendation>;
}
