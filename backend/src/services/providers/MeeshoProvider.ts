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

export class MeeshoProvider implements MarketplaceProvider {
  
  async calculateFees(input: FeeCalculationInput): Promise<FeeBreakdown> {
    const components: FeeComponent[] = [];
    let totalMarketplaceFees = 0;

    // Resolve Commission Fee (Expected 0 but handled robustly)
    const commissionResult = await RuleResolverService.resolve({ ...input, feeType: 'commission' });
    if (commissionResult.matched && commissionResult.percentage !== undefined) {
      const amount = (input.sellingPrice * commissionResult.percentage) / 100;
      totalMarketplaceFees += amount;
      components.push({ name: 'Commission Fee', amount, ruleId: commissionResult.ruleId, ruleVersion: commissionResult.ruleVersion, source: commissionResult.source, calculationMethod: 'percentage', status: 'AVAILABLE' });
    } else {
      components.push({ name: 'Commission Fee', amount: 0, source: 'UNAVAILABLE', status: 'UNAVAILABLE' });
    }

    // Resolve other services
    const servicesResult = await RuleResolverService.resolve({ ...input, feeType: 'other_services' });
    if (servicesResult.matched && servicesResult.fixedAmount !== undefined) {
      totalMarketplaceFees += servicesResult.fixedAmount;
      components.push({ name: 'Other Services', amount: servicesResult.fixedAmount, ruleId: servicesResult.ruleId, ruleVersion: servicesResult.ruleVersion, source: servicesResult.source, calculationMethod: 'fixed', status: 'AVAILABLE' });
    }

    return { totalMarketplaceFees, components };
  }

  async calculateShipping(input: ShippingInput): Promise<ShippingBreakdown> {
    const components: FeeComponent[] = [];
    let totalShippingCost = 0;
    
    const volumetricWeight = (input.length * input.width * input.height) / 5000;
    const chargeableWeight = Math.max(input.actualWeight, volumetricWeight * 1000);

    // Forward Shipping
    const shippingResult = await RuleResolverService.resolve({
      marketplaceCode: input.marketplaceCode,
      feeType: 'forward_shipping',
      fulfilmentType: input.fulfilmentType,
      zone: input.zone,
      weight: chargeableWeight
    });

    if (shippingResult.matched && shippingResult.fixedAmount !== undefined) {
      totalShippingCost += shippingResult.fixedAmount;
      components.push({ name: 'Forward Shipping Fee', amount: shippingResult.fixedAmount, ruleId: shippingResult.ruleId, ruleVersion: shippingResult.ruleVersion, source: shippingResult.source });
    }

    return { chargeableWeight, volumetricWeight: volumetricWeight * 1000, totalShippingCost, components };
  }

  async calculateReturns(input: ReturnInput): Promise<number> {
    return (input.returnRate / 100) * (input.originalShipping + input.returnShipping + input.marketplaceReturnFee + input.repackagingCost + input.damageLoss);
  }

  async calculateSettlement(input: SettlementInput): Promise<any> { throw new Error('Method not implemented.'); }
  async getRecommendedPrice(input: PriceInput): Promise<PriceRecommendation> { throw new Error('Method not implemented.'); }
}
