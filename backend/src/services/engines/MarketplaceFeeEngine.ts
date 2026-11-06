import { FeeBreakdown, MarketplaceProvider } from '../providers/MarketplaceProvider';
import { ProviderFactory } from '../providers/ProviderFactory';

export interface FeeEngineInput {
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

export class MarketplaceFeeEngine {
  static async calculate(input: FeeEngineInput): Promise<FeeBreakdown> {
    const provider: MarketplaceProvider = ProviderFactory.getMarketplaceProvider(input.marketplaceCode);
    return await provider.calculateFees(input);
  }
}
