import MarketplaceFeeRule, { IMarketplaceFeeRule } from '../models/MarketplaceFeeRule';

export interface ResolveRuleInput {
  marketplaceCode: string;
  feeType: string;
  categoryId?: string; // Optional depending on rule
  fulfilmentType?: string;
  sellerTier?: string;
  zone?: string;
  paymentMethod?: string;
  price?: number;
  weight?: number;
  date?: Date; // Defaults to now
}

export interface RuleResolveResult {
  matched: boolean;
  status?: 'MATCHED' | 'RULE_UNAVAILABLE' | 'CONFLICT';
  ruleId?: string;
  ruleVersion?: number;
  marketplace?: string;
  feeType?: string;
  calculationMethod?: string;
  percentage?: number;
  fixedAmount?: number;
  perKgAmount?: number;
  perOrderAmount?: number;
  formula?: string;
  source?: string;
  sourceUrl?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  confidence?: string;
  matchDetails?: {
    category: string;
    fulfilment: string;
    sellerTier: string;
    zone: string;
    paymentMethod: string;
    priceRange: string;
    weightRange: string;
  };
  error?: string;
}

export class RuleResolverService {
  /**
   * Calculate specificity score for a given rule against the input
   */
  private static calculateSpecificity(rule: IMarketplaceFeeRule, input: ResolveRuleInput) {
    let score = 0;
    const matchDetails = {
      category: 'default',
      fulfilment: 'default',
      sellerTier: 'default',
      zone: 'default',
      paymentMethod: 'default',
      priceRange: 'default',
      weightRange: 'default',
    };

    if (rule.categoryId && input.categoryId && rule.categoryId.toString() === input.categoryId.toString()) {
      score += 100;
      matchDetails.category = 'exact';
    }

    if (rule.fulfilmentType && input.fulfilmentType && rule.fulfilmentType === input.fulfilmentType) {
      score += 50;
      matchDetails.fulfilment = 'exact';
    }

    if (rule.sellerTier && input.sellerTier && rule.sellerTier === input.sellerTier) {
      score += 40;
      matchDetails.sellerTier = 'exact';
    }

    if (rule.zone && input.zone && rule.zone === input.zone) {
      score += 30;
      matchDetails.zone = 'exact';
    }

    if (rule.paymentMethod && input.paymentMethod && rule.paymentMethod === input.paymentMethod) {
      score += 20;
      matchDetails.paymentMethod = 'exact';
    }

    if (rule.priceMin !== undefined && rule.priceMax !== undefined) {
      score += 10;
      matchDetails.priceRange = 'matched';
    }

    if (rule.weightMin !== undefined && rule.weightMax !== undefined) {
      score += 10;
      matchDetails.weightRange = 'matched';
    }

    return { score, matchDetails };
  }

  /**
   * Resolves the most specific fee rule for a given context
   */
  public static async resolve(input: ResolveRuleInput): Promise<RuleResolveResult> {
    const targetDate = input.date || new Date();

    // 1. Build initial query for REQUIRED fields and bounds
    const query: any = {
      marketplaceCode: input.marketplaceCode,
      feeType: input.feeType,
      status: 'Active',
      effectiveFrom: { $lte: targetDate },
      $or: [
        { effectiveUntil: null },
        { effectiveUntil: { $exists: false } },
        { effectiveUntil: { $gt: targetDate } }
      ]
    };

    // Filter by price bounds if price is provided and rule enforces it
    if (input.price !== undefined && !isNaN(input.price)) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { priceMin: null },
          { priceMin: { $exists: false } },
          { priceMin: { $lte: input.price } }
        ]
      });
      query.$and.push({
        $or: [
          { priceMax: null },
          { priceMax: { $exists: false } },
          { priceMax: { $gte: input.price } }
        ]
      });
    }

    // Filter by weight bounds if weight is provided and rule enforces it
    if (input.weight !== undefined && !isNaN(input.weight)) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { weightMin: null },
          { weightMin: { $exists: false } },
          { weightMin: { $lte: input.weight } }
        ]
      });
      query.$and.push({
        $or: [
          { weightMax: null },
          { weightMax: { $exists: false } },
          { weightMax: { $gte: input.weight } }
        ]
      });
    }

    // Include rules that either match exactly OR don't specify the attribute (generic fallback)
    if (input.categoryId) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ categoryId: input.categoryId }, { categoryId: { $exists: false } }, { categoryId: null }] });
    }
    if (input.fulfilmentType) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ fulfilmentType: input.fulfilmentType }, { fulfilmentType: { $exists: false } }, { fulfilmentType: null }] });
    }
    if (input.sellerTier) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ sellerTier: input.sellerTier }, { sellerTier: { $exists: false } }, { sellerTier: null }] });
    }
    if (input.zone) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ zone: input.zone }, { zone: { $exists: false } }, { zone: null }] });
    }
    if (input.paymentMethod) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ paymentMethod: input.paymentMethod }, { paymentMethod: { $exists: false } }, { paymentMethod: null }] });
    }

    // 2. Fetch all matching candidates
    const candidates = await MarketplaceFeeRule.find(query).lean();

    if (candidates.length === 0) {
      return {
        matched: false,
        status: 'RULE_UNAVAILABLE',
        error: 'RULE_UNAVAILABLE: No verified fee rule found for context'
      };
    }

    // 3. Score and sort candidates by specificity
    const scoredCandidates = candidates.map(rule => {
      const { score, matchDetails } = this.calculateSpecificity(rule as any, input);
      return { rule, score, matchDetails };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestScore = scoredCandidates[0].score;
    const bestCandidates = scoredCandidates.filter(c => c.score === bestScore);

    // 4. Conflict detection
    if (bestCandidates.length > 1) {
      throw new Error(`Fee rule conflict detected. ${bestCandidates.length} active rules match this calculation with equal specificity. Resolve the conflicting rules before calculating.`);
    }

    const winningRule = bestCandidates[0].rule as any;
    const winningMatchDetails = bestCandidates[0].matchDetails;

    return {
      matched: true,
      ruleId: winningRule._id.toString(),
      ruleVersion: winningRule.version,
      marketplace: winningRule.marketplaceCode,
      feeType: winningRule.feeType,
      calculationMethod: winningRule.calculationMethod,
      percentage: winningRule.percentage,
      fixedAmount: winningRule.fixedAmount,
      perKgAmount: winningRule.perKgAmount,
      perOrderAmount: winningRule.perOrderAmount,
      formula: winningRule.formula,
      source: winningRule.source,
      sourceUrl: winningRule.sourceUrl,
      effectiveFrom: winningRule.effectiveFrom,
      effectiveUntil: winningRule.effectiveUntil,
      confidence: winningRule.confidence,
      matchDetails: winningMatchDetails,
    };
  }
}
