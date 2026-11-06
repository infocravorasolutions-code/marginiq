export interface AdvertisingEngineInput {
  advertisingPercent?: number; // Target ACoS or ad spend % of revenue
  fixedAdSpendPerUnit?: number; // Fixed Rs amount to acquire a sale
  sellingPrice: number;
}

export interface AdvertisingResult {
  totalAdvertisingCost: number;
}

export class AdvertisingEngine {
  static calculate(input: AdvertisingEngineInput): AdvertisingResult {
    let cost = 0;

    if (input.fixedAdSpendPerUnit) {
      cost = input.fixedAdSpendPerUnit;
    } else if (input.advertisingPercent) {
      cost = input.sellingPrice * (input.advertisingPercent / 100);
    }

    return { totalAdvertisingCost: cost };
  }
}
