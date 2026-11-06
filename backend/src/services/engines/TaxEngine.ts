export interface TaxEngineInput {
  isGstRegistered: boolean;
  productGstPercent: number;
  productCost: number;
  productCostIncludesGst: boolean;
  sellingPrice: number;
  totalMarketplaceFees: number;
  totalShippingCost: number;
  totalReturnFees: number;
  totalAdvertisingCost: number;
}

export interface TaxResult {
  productGstAmount: number; // Output tax
  productPurchaseIct: number; // ITC from purchasing product
  marketplaceFeesGstAmount: number; // 18%
  shippingGstAmount: number; // 18%
  returnFeesGstAmount: number; // 18%
  advertisingGstAmount: number; // 18%
  totalGstOutput: number;
  totalGstInput: number; // Total ITC
  netGstPayable: number; // To Government
}

export class TaxEngine {
  static calculate(input: TaxEngineInput): TaxResult {
    if (!input.isGstRegistered) {
      // Unregistered seller cannot collect tax or claim ITC.
      const gstRateOnServices = 18;
      return {
        productGstAmount: 0,
        productPurchaseIct: 0,
        marketplaceFeesGstAmount: input.totalMarketplaceFees * (gstRateOnServices / 100),
        shippingGstAmount: input.totalShippingCost * (gstRateOnServices / 100),
        returnFeesGstAmount: input.totalReturnFees * (gstRateOnServices / 100),
        advertisingGstAmount: input.totalAdvertisingCost * (gstRateOnServices / 100),
        totalGstOutput: 0,
        totalGstInput: 0,
        netGstPayable: 0
      };
    }

    // 1. Output Tax (Tax collected from customer on Selling Price)
    const productGstAmount = input.sellingPrice - (input.sellingPrice / (1 + (input.productGstPercent / 100)));

    // 2. Input Tax on Product Purchase (ITC)
    let productPurchaseIct = 0;
    if (input.productCostIncludesGst) {
      productPurchaseIct = input.productCost - (input.productCost / (1 + (input.productGstPercent / 100)));
    } else {
      productPurchaseIct = input.productCost * (input.productGstPercent / 100);
    }
    // 3. Input Tax on Marketplace Services (18%)
    const gstRateOnServices = 18;
    
    const marketplaceFeesGstAmount = input.totalMarketplaceFees * (gstRateOnServices / 100);
    const shippingGstAmount = input.totalShippingCost * (gstRateOnServices / 100);
    const returnFeesGstAmount = input.totalReturnFees * (gstRateOnServices / 100);
    const advertisingGstAmount = input.totalAdvertisingCost * (gstRateOnServices / 100);

    const totalGstInput = productPurchaseIct + marketplaceFeesGstAmount + shippingGstAmount + returnFeesGstAmount + advertisingGstAmount;
    
    // Net GST Payable = Output GST - Input GST
    // If negative, it means credit is accumulated
    const netGstPayable = productGstAmount - totalGstInput;

    return {
      productGstAmount,
      productPurchaseIct,
      marketplaceFeesGstAmount,
      shippingGstAmount,
      returnFeesGstAmount,
      advertisingGstAmount,
      totalGstOutput: productGstAmount,
      totalGstInput,
      netGstPayable
    };
  }
}
