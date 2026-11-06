import { ShippingBreakdown, MarketplaceProvider } from '../providers/MarketplaceProvider';
import { ProviderFactory } from '../providers/ProviderFactory';

export interface ShippingEngineInput {
  marketplaceCode: string;
  actualWeight: number; // grams
  length: number; // cm
  width: number; // cm
  height: number; // cm
  origin: string;
  destination: string;
  zone: string;
  fulfilmentType: string;
  packagingCost: number; // INR
}

export interface ShippingResult extends ShippingBreakdown {
  packagingCost: number;
  totalLandedShippingCost: number;
}

export class ShippingEngine {
  static async calculate(input: ShippingEngineInput): Promise<ShippingResult> {
    const provider: MarketplaceProvider = ProviderFactory.getMarketplaceProvider(input.marketplaceCode);
    
    const breakdown = await provider.calculateShipping({
      actualWeight: input.actualWeight,
      length: input.length,
      width: input.width,
      height: input.height,
      origin: input.origin,
      destination: input.destination,
      zone: input.zone,
      fulfilmentType: input.fulfilmentType,
      marketplaceCode: input.marketplaceCode
    });

    return {
      ...breakdown,
      packagingCost: input.packagingCost || 0,
      totalLandedShippingCost: (breakdown.totalShippingCost || 0) + (input.packagingCost || 0)
    };
  }
}
