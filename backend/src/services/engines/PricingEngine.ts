import { ProfitabilityEngine, ProfitabilityInput, ProfitabilityResult } from './ProfitabilityEngine';

export interface TargetPricingInput extends Omit<ProfitabilityInput, 'sellingPrice'> {
  targetMarginPercent?: number; // e.g., 20 for 20% margin
  targetNetProfit?: number; // e.g., 100 for Rs 100 profit
}

export interface PricingRecommendationResult {
  breakEvenPrice: number;
  targetPrice: number;
  aggressivePrice: number; // e.g., 10% margin
  conservativePrice: number; // e.g., 30% margin
}

export class PricingEngine {
  /**
   * Non-linear solver to find the optimal selling price that hits a target metric.
   * Because marketplace fees have price brackets, algebra fails here. We use binary search.
   */
  private static async solveForPrice(
    input: Omit<ProfitabilityInput, 'sellingPrice'>,
    evaluator: (res: ProfitabilityResult) => number, // Returns the distance from the target. We want 0.
    minPrice: number = 0,
    maxPrice: number = 50000,
    tolerance: number = 0.5
  ): Promise<number> {
    let low = minPrice;
    let high = maxPrice;
    let bestPrice = minPrice;

    for (let i = 0; i < 50; i++) { // Max 50 iterations
      const mid = (low + high) / 2;
      
      const result = await ProfitabilityEngine.calculate({
        ...input,
        sellingPrice: mid
      });

      const distance = evaluator(result);
      
      if (Math.abs(distance) <= tolerance) {
        return mid;
      }

      // If distance is negative, it means we are below target, we need to increase price.
      if (distance < 0) {
        low = mid;
      } else {
        high = mid;
      }
      bestPrice = mid;
    }

    return bestPrice;
  }

  static async getRecommendedPricing(input: TargetPricingInput): Promise<PricingRecommendationResult> {
    const baseInput = { ...input } as any;
    delete baseInput.targetMarginPercent;
    delete baseInput.targetNetProfit;

    // 1. Break-Even Price (Target Profit = 0)
    const breakEvenPrice = await this.solveForPrice(
      baseInput,
      (res) => res.netProfit // Target 0
    );

    // 2. Target Price
    let targetPrice = breakEvenPrice;
    if (input.targetMarginPercent) {
      targetPrice = await this.solveForPrice(
        baseInput,
        (res) => res.netMargin - input.targetMarginPercent! // Target margin difference = 0
      );
    } else if (input.targetNetProfit) {
      targetPrice = await this.solveForPrice(
        baseInput,
        (res) => res.netProfit - input.targetNetProfit! // Target profit difference = 0
      );
    }

    // 3. Aggressive Price (assume 10% margin is competitive)
    const aggressivePrice = await this.solveForPrice(
      baseInput,
      (res) => res.netMargin - 10
    );

    // 4. Conservative Price (assume 30% margin is premium)
    const conservativePrice = await this.solveForPrice(
      baseInput,
      (res) => res.netMargin - 30
    );

    return {
      breakEvenPrice: Math.ceil(breakEvenPrice),
      targetPrice: Math.ceil(targetPrice),
      aggressivePrice: Math.ceil(aggressivePrice),
      conservativePrice: Math.ceil(conservativePrice)
    };
  }
}
