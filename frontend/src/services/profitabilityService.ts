export interface ProfitabilityRequest {
  marketplaceCode: string;
  categoryId?: string;
  sellingPrice: number;
  productLandedCost: number;
  productGstPercent: number;
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

export interface PricingRequest extends Omit<ProfitabilityRequest, 'sellingPrice'> {
  targetMarginPercent?: number;
  targetNetProfit?: number;
}

export const calculateProfitability = async (token: string, payload: ProfitabilityRequest) => {
  const response = await fetch('/api/profitability/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to calculate profitability');
  }

  return data.data;
};

export const calculatePricing = async (token: string, payload: PricingRequest) => {
  const response = await fetch('/api/profitability/pricing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to calculate pricing');
  }

  return data.data;
};

export const compareMarketplaces = async (token: string, payload: Omit<ProfitabilityRequest, 'marketplaceCode'>) => {
  const response = await fetch('/api/profitability/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to compare marketplaces');
  }

  return data.data; // Array of comparison results
};
