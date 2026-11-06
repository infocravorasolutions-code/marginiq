export interface NormalizedSettlementTransaction {
  marketplaceOrderId: string;
  transactionId: string;
  transactionType: 'Order' | 'Refund' | 'Adjustment' | 'ServiceFee' | 'Other';
  transactionDate: Date;
  
  // Normalized amounts
  principalAmount: number;
  totalMarketplaceFees: number;
  taxLiable: number;
  tcsAmount: number;
  totalTaxes: number;
  totalShipping: number;
  otherDeductions: number;
  
  netSettlementAmount: number;
  
  // The raw row directly from CSV/Excel
  rawTransactionData: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SettlementParser {
  marketplaceCode: string;

  /**
   * Identifies if this parser can handle the provided file headers
   */
  canParse(headers: string[]): boolean;

  /**
   * Parse the raw CSV/Excel rows into NormalizedSettlementTransactions
   */
  parse(rawRows: Record<string, any>[]): Promise<NormalizedSettlementTransaction[]>;

  /**
   * Validate the parsed transactions for required fields and mathematical correctness
   */
  validate(transactions: NormalizedSettlementTransaction[]): ValidationResult;
}
