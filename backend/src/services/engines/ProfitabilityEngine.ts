import { MarketplaceFeeEngine } from './MarketplaceFeeEngine';
import { ShippingEngine } from './ShippingEngine';
import { ReturnsEngine } from './ReturnsEngine';
import { DamageEngine } from './DamageEngine';
import { AdvertisingEngine } from './AdvertisingEngine';
import { DiscountEngine } from './DiscountEngine';
import { TaxEngine } from './TaxEngine';

export interface ProfitabilityInput {
  marketplaceCode: string;
  categoryId?: string;
  sellingPrice: number;
  productLandedCost: number;
  productGstPercent: number;
  isGstRegistered?: boolean;
  productCostIncludesGst?: boolean;

  weight: number;
  length: number;
  width: number;
  height: number;
  packagingCost: number;
  
  fulfilmentType: string;
  sellerTier?: string;
  zone: string;
  paymentMethod: string;
  origin: string;
  destination: string;

  rtoPercent: number;
  customerReturnPercent: number;
  damagePercent: number;
  reimbursementPercent: number;
  
  advertisingPercent?: number;
  fixedAdSpendPerUnit?: number;
  
  couponPercent?: number;
  couponFixed?: number;
}

export interface ProfitabilityResult {
  sellingPrice: number;
  productLandedCost: number;
  
  fees: any;
  shipping: any;
  returns: any;
  damage: any;
  advertising: any;
  discounts: any;
  tax: any;
  
  totalCost: number;
  netProfit: number;
  netMargin: number; // percentage
  roi: number; // Return on Investment percentage
}

export class ProfitabilityEngine {
  static async calculate(input: ProfitabilityInput): Promise<ProfitabilityResult> {
    // 1. Discounts
    const discountRes = DiscountEngine.calculate({
      sellingPrice: input.sellingPrice,
      couponFixed: input.couponFixed,
      couponPercent: input.couponPercent
    });

    // Marketplace fees are usually calculated on the price AFTER discounts
    const effectivePrice = discountRes.finalCustomerPrice;

    // 2. Marketplace Fees
    const feeRes = await MarketplaceFeeEngine.calculate({
      marketplaceCode: input.marketplaceCode,
      categoryId: input.categoryId,
      sellingPrice: effectivePrice,
      fulfilmentType: input.fulfilmentType,
      sellerTier: input.sellerTier,
      zone: input.zone,
      paymentMethod: input.paymentMethod,
      weight: input.weight
    });

    // 3. Shipping
    const shipRes = await ShippingEngine.calculate({
      marketplaceCode: input.marketplaceCode,
      actualWeight: input.weight,
      length: input.length,
      width: input.width,
      height: input.height,
      origin: input.origin,
      destination: input.destination,
      zone: input.zone,
      fulfilmentType: input.fulfilmentType,
      packagingCost: input.packagingCost || 0
    });

    // 4. Returns & RTO
    // We assume return shipping costs equal forward shipping (depends on marketplace)
    const returnRes = ReturnsEngine.calculate({
      rtoPercent: input.rtoPercent || 0,
      customerReturnPercent: input.customerReturnPercent || 0,
      forwardShippingCost: shipRes.totalShippingCost || 0,
      returnShippingCostRTO: shipRes.totalShippingCost || 0, 
      returnShippingCostCustomer: shipRes.totalShippingCost || 0,
      marketplaceReturnFee: (feeRes.totalMarketplaceFees || 0) * 0.2, // Rough Amazon-style assumption for refund fee
      repackagingCost: input.packagingCost || 0
    });

    // 5. Damage / Loss
    const damageRes = DamageEngine.calculate({
      damagePercent: input.damagePercent || 0,
      productCost: input.productLandedCost || 0,
      reimbursementPercent: input.reimbursementPercent || 0
    });

    // 6. Advertising
    const adRes = AdvertisingEngine.calculate({
      sellingPrice: effectivePrice,
      advertisingPercent: input.advertisingPercent || 0,
      fixedAdSpendPerUnit: input.fixedAdSpendPerUnit || 0
    });

    // 7. Taxes
    const isRegistered = input.isGstRegistered !== false; // Default true
    
    const taxRes = TaxEngine.calculate({
      isGstRegistered: isRegistered,
      productGstPercent: input.productGstPercent,
      productCost: input.productLandedCost,
      productCostIncludesGst: input.productCostIncludesGst !== false, // Default true
      sellingPrice: effectivePrice,
      totalMarketplaceFees: feeRes.totalMarketplaceFees,
      totalShippingCost: shipRes.totalShippingCost,
      totalReturnFees: returnRes.totalStatisticalReturnCost,
      totalAdvertisingCost: adRes.totalAdvertisingCost
    });

    // 8. Final Calculation (Cash Flow perspective)
    // In India, marketplaces collect 18% GST on their fees.
    const productActualCost = input.productCostIncludesGst === false && isRegistered
      ? input.productLandedCost + taxRes.productPurchaseIct
      : input.productLandedCost;

    const totalCost = 
      productActualCost +
      (feeRes.totalMarketplaceFees + taxRes.marketplaceFeesGstAmount) +
      (shipRes.totalLandedShippingCost + taxRes.shippingGstAmount) +
      (returnRes.totalStatisticalReturnCost + taxRes.returnFeesGstAmount) +
      damageRes.statisticalDamageLoss +
      (adRes.totalAdvertisingCost + taxRes.advertisingGstAmount) +
      discountRes.totalDiscountCost +
      taxRes.netGstPayable;

    const netProfit = effectivePrice - totalCost;
    
    // Margins
    const netMargin = (netProfit / input.sellingPrice) * 100;
    
    // ROI = (Profit / Cost) * 100
    const roi = (netProfit / totalCost) * 100;

    return {
      sellingPrice: input.sellingPrice,
      productLandedCost: input.productLandedCost,
      fees: feeRes,
      shipping: shipRes,
      returns: returnRes,
      damage: damageRes,
      advertising: adRes,
      discounts: discountRes,
      tax: taxRes,
      totalCost,
      netProfit,
      netMargin,
      roi
    };
  }
}
