export interface DamageEngineInput {
  damagePercent: number; // % of shipped units that get damaged/lost completely
  productCost: number; // Landed cost of the product
  reimbursementPercent: number; // Expected % of product cost the marketplace reimburses for damage
}

export interface DamageResult {
  statisticalDamageLoss: number;
}

export class DamageEngine {
  static calculate(input: DamageEngineInput): DamageResult {
    const damageProbability = input.damagePercent / 100;
    
    // Cost if a product is damaged/lost
    const costPerDamagedUnit = input.productCost;
    
    // What we get back from marketplace claim
    const recoveredAmount = costPerDamagedUnit * (input.reimbursementPercent / 100);
    
    const netLossPerDamagedUnit = Math.max(0, costPerDamagedUnit - recoveredAmount);
    
    const statisticalDamageLoss = damageProbability * netLossPerDamagedUnit;

    return {
      statisticalDamageLoss
    };
  }
}
