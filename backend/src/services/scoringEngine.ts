export interface ScoringInputs {
  netMargin: number; // e.g., 34.1
  competitionScore: 'LOW' | 'MEDIUM' | 'HIGH';
  returnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  shippingWeight: number; // in grams
  brandability: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScoringResult {
  score: number;
  classification: 'Exceptional' | 'Strong Opportunity' | 'Good' | 'Moderate' | 'Weak' | 'Avoid';
  recommendation: string;
  breakdown: {
    profitability: number; // max 25
    competition: number; // max 25
    returnRisk: number; // max 25
    shipping: number; // max 15
    brandability: number; // max 10
  };
}

export const calculateOpportunityScore = (inputs: ScoringInputs): ScoringResult => {
  let score = 0;
  const breakdown = {
    profitability: 0,
    competition: 0,
    returnRisk: 0,
    shipping: 0,
    brandability: 0,
  };

  // 1. Profitability (Max 25 points)
  // Target > 30% gets full points, drops off below that.
  if (inputs.netMargin >= 30) breakdown.profitability = 25;
  else if (inputs.netMargin >= 20) breakdown.profitability = 20;
  else if (inputs.netMargin >= 10) breakdown.profitability = 10;
  else if (inputs.netMargin > 0) breakdown.profitability = 5;
  else breakdown.profitability = 0;

  // 2. Competition (Max 25 points)
  if (inputs.competitionScore === 'LOW') breakdown.competition = 25;
  else if (inputs.competitionScore === 'MEDIUM') breakdown.competition = 15;
  else breakdown.competition = 5;

  // 3. Return Risk (Max 25 points)
  if (inputs.returnRisk === 'LOW') breakdown.returnRisk = 25;
  else if (inputs.returnRisk === 'MEDIUM') breakdown.returnRisk = 15;
  else breakdown.returnRisk = 0;

  // 4. Shipping Efficiency (Max 15 points)
  // Lower weight is better. Under 500g is ideal.
  if (inputs.shippingWeight <= 500) breakdown.shipping = 15;
  else if (inputs.shippingWeight <= 1000) breakdown.shipping = 10;
  else if (inputs.shippingWeight <= 2000) breakdown.shipping = 5;
  else breakdown.shipping = 0;

  // 5. Brandability (Max 10 points)
  if (inputs.brandability === 'HIGH') breakdown.brandability = 10;
  else if (inputs.brandability === 'MEDIUM') breakdown.brandability = 5;
  else breakdown.brandability = 2;

  // Aggregate
  score =
    breakdown.profitability +
    breakdown.competition +
    breakdown.returnRisk +
    breakdown.shipping +
    breakdown.brandability;

  // Classification & Recommendation
  let classification: ScoringResult['classification'] = 'Weak';
  let recommendation = '';

  if (score >= 90) {
    classification = 'Exceptional';
    recommendation =
      'This product has a stellar margin profile, very low risk, and excellent private-label potential. Highly Recommended.';
  } else if (score >= 80) {
    classification = 'Strong Opportunity';
    recommendation =
      'This product has a strong margin profile, relatively low return risk, and good potential. Recommended.';
  } else if (score >= 70) {
    classification = 'Good';
    recommendation =
      'Profitability is acceptable. Monitor competition and advertising costs to ensure healthy margins.';
  } else if (score >= 60) {
    classification = 'Moderate';
    recommendation =
      'Moderate opportunity. Risk factors or low margins require a highly optimized supply chain to succeed.';
  } else if (score >= 50) {
    classification = 'Weak';
    recommendation =
      'Weak opportunity due to high competition, high return rates, or low margins. Consider looking for better alternatives.';
  } else {
    classification = 'Avoid';
    recommendation =
      'The estimated margin is too low after marketplace fees and shipping. High risk factors further reduce expected profitability. Avoid.';
  }

  return {
    score,
    classification,
    recommendation,
    breakdown,
  };
};
