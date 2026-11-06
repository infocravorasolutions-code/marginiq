export interface ReturnsEngineInput {
  rtoPercent: number; // Return To Origin (Courier Return) %
  customerReturnPercent: number; // Customer Return %
  forwardShippingCost: number; // Normal forward shipping
  returnShippingCostRTO: number; // Shipping cost charged on RTO (usually 0 or forward amount)
  returnShippingCostCustomer: number; // Shipping cost charged on Customer Return
  marketplaceReturnFee: number; // E.g., Amazon charges 20% of commission as refund admin fee
  repackagingCost: number; // Cost to repackage a returned item to make it sellable
}

export interface ReturnsResult {
  statisticalRtoCost: number;
  statisticalCustomerReturnCost: number;
  totalStatisticalReturnCost: number;
}

export class ReturnsEngine {
  static calculate(input: ReturnsEngineInput): ReturnsResult {
    // 1. RTO Cost
    // In RTO, forward shipping is lost, return shipping might be charged, packaging is wasted.
    const rtoProbability = input.rtoPercent / 100;
    const rtoCostPerOrder = input.forwardShippingCost + input.returnShippingCostRTO + input.repackagingCost;
    const statisticalRtoCost = rtoProbability * rtoCostPerOrder;

    // 2. Customer Return Cost
    // In Customer Return, forward shipping is lost, return shipping is charged, marketplace fee is charged, packaging is wasted.
    const crProbability = input.customerReturnPercent / 100;
    const crCostPerOrder = input.forwardShippingCost + input.returnShippingCostCustomer + input.marketplaceReturnFee + input.repackagingCost;
    const statisticalCustomerReturnCost = crProbability * crCostPerOrder;

    return {
      statisticalRtoCost,
      statisticalCustomerReturnCost,
      totalStatisticalReturnCost: statisticalRtoCost + statisticalCustomerReturnCost
    };
  }
}
