export interface DiscountEngineInput {
  sellingPrice: number;
  couponPercent?: number;
  couponFixed?: number;
  marketplaceParticipationFee?: number; // e.g. lightning deal participation fee divided by expected units
}

export interface DiscountResult {
  finalCustomerPrice: number;
  totalDiscountCost: number;
}

export class DiscountEngine {
  static calculate(input: DiscountEngineInput): DiscountResult {
    let totalDiscountCost = 0;

    if (input.couponFixed) {
      totalDiscountCost += input.couponFixed;
    }

    if (input.couponPercent) {
      totalDiscountCost += input.sellingPrice * (input.couponPercent / 100);
    }

    if (input.marketplaceParticipationFee) {
      totalDiscountCost += input.marketplaceParticipationFee;
    }

    const finalCustomerPrice = Math.max(0, input.sellingPrice - totalDiscountCost);

    return {
      finalCustomerPrice,
      totalDiscountCost
    };
  }
}
