import { Response, Request } from 'express';
import { ProfitabilityEngine, ProfitabilityInput } from '../services/engines/ProfitabilityEngine';
import { PricingEngine, TargetPricingInput } from '../services/engines/PricingEngine';

export const calculateProfit = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: ProfitabilityInput = req.body;
    const result = await ProfitabilityEngine.calculate(input);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const calculatePricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: TargetPricingInput = req.body;
    const result = await PricingEngine.getRecommendedPricing(input);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const compareMarketplaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: Omit<ProfitabilityInput, 'marketplaceCode'> = req.body;
    
    // We compare across the big three
    const marketplaces = ['amazon', 'flipkart', 'meesho'];
    const comparisons: any[] = [];

    for (const code of marketplaces) {
      try {
        const result = await ProfitabilityEngine.calculate({
          ...input,
          marketplaceCode: code
        } as ProfitabilityInput);
        comparisons.push({ marketplaceCode: code, success: true, result });
      } catch (err: any) {
        comparisons.push({ marketplaceCode: code, success: false, error: err.message });
      }
    }

    res.json({ success: true, data: comparisons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
