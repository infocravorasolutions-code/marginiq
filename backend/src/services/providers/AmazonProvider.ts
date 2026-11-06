import { 
  MarketplaceProvider, 
  FeeCalculationInput, 
  FeeBreakdown,
  ShippingInput,
  ShippingBreakdown,
  ReturnInput,
  SettlementInput,
  PriceInput,
  PriceRecommendation,
  FeeComponent
} from './MarketplaceProvider';
import { RuleResolverService } from '../RuleResolverService';

export class AmazonProvider implements MarketplaceProvider {
  
  async calculateFees(input: FeeCalculationInput): Promise<FeeBreakdown> {
    const components: FeeComponent[] = [];
    let totalMarketplaceFees = 0;

    // 1. Resolve Referral Fee
    const referralResult = await RuleResolverService.resolve({
      ...input,
      feeType: 'referral'
    });

    if (referralResult.matched && referralResult.percentage !== undefined) {
      const amount = (input.sellingPrice * referralResult.percentage) / 100;
      totalMarketplaceFees += amount;
      components.push({
        name: 'Referral Fee',
        amount,
        ruleId: referralResult.ruleId,
        ruleVersion: referralResult.ruleVersion,
        source: referralResult.source,
        calculationMethod: 'percentage',
        status: 'AVAILABLE'
      });
    } else {
      components.push({
        name: 'Referral Fee',
        amount: 0,
        source: 'UNAVAILABLE',
        status: 'UNAVAILABLE'
      });
    }

    // 2. Resolve Closing Fee
    const closingResult = await RuleResolverService.resolve({
      ...input,
      feeType: 'closing'
    });

    if (closingResult.matched && closingResult.fixedAmount !== undefined) {
      totalMarketplaceFees += closingResult.fixedAmount;
      components.push({
        name: 'Closing Fee',
        amount: closingResult.fixedAmount,
        ruleId: closingResult.ruleId,
        ruleVersion: closingResult.ruleVersion,
        source: closingResult.source,
        calculationMethod: 'fixed',
        status: 'AVAILABLE'
      });
    } else {
      components.push({
        name: 'Closing Fee',
        amount: 0,
        source: 'UNAVAILABLE',
        status: 'UNAVAILABLE'
      });
    }

    return { totalMarketplaceFees, components };
  }

  async calculateShipping(input: ShippingInput): Promise<ShippingBreakdown> {
    const components: FeeComponent[] = [];
    let totalShippingCost = 0;

    const chargeableWeight = Math.max(input.actualWeight, (input.length * input.width * input.height) / 5); // Fallback volumetric

    // Resolve shipping fee
    const shippingResult = await RuleResolverService.resolve({
      marketplaceCode: input.marketplaceCode,
      feeType: 'shipping',
      fulfilmentType: input.fulfilmentType,
      zone: input.zone,
      weight: chargeableWeight
    });

    if (shippingResult.matched && shippingResult.fixedAmount !== undefined) {
      totalShippingCost += shippingResult.fixedAmount;
      components.push({
        name: 'Shipping Fee',
        amount: shippingResult.fixedAmount,
        ruleId: shippingResult.ruleId,
        ruleVersion: shippingResult.ruleVersion,
        source: shippingResult.source,
      });
    } else {
      components.push({
        name: 'Shipping Fee',
        amount: 0,
        source: 'Missing Rule - Estimated as 0'
      });
    }

    return {
      chargeableWeight,
      volumetricWeight: (input.length * input.width * input.height) / 5,
      totalShippingCost,
      components
    };
  }

  async calculateReturns(input: ReturnInput): Promise<number> {
    // Basic calculation model for returns
    return (input.returnRate / 100) * (input.originalShipping + input.returnShipping + input.marketplaceReturnFee + input.repackagingCost + input.damageLoss);
  }

  async calculateSettlement(input: SettlementInput): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getRecommendedPrice(input: PriceInput): Promise<PriceRecommendation> {
    throw new Error('Method not implemented.');
  }
}
