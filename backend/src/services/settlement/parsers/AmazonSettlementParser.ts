import crypto from 'crypto';
import { SettlementParser, NormalizedSettlementTransaction, ValidationResult } from '../SettlementParser';

export class AmazonSettlementParser implements SettlementParser {
  marketplaceCode = 'amazon';

  canParse(headers: string[]): boolean {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const requiredHeaders = ['settlement id', 'type', 'order id', 'total'];
    return requiredHeaders.every(h => normalizedHeaders.includes(h));
  }

  async parse(rawRows: Record<string, any>[]): Promise<NormalizedSettlementTransaction[]> {
    const normalized: NormalizedSettlementTransaction[] = [];

    const parseFloatSafe = (val: string | number) => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return val;
      const parsed = parseFloat(val.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    let rowIndex = 0;

    for (const row of rawRows) {
      rowIndex++;
      
      // Normalize keys to lowercase for robust extraction
      const r: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        r[k.toLowerCase().trim()] = String(v);
      }

      const type = r['type'] || 'Other';
      
      // Skip "Transfer" as it is just the bank payout, not an order reconciliation line
      if (type.toLowerCase() === 'transfer') {
        continue;
      }

      let transactionType: NormalizedSettlementTransaction['transactionType'] = 'Other';
      if (type === 'Order') transactionType = 'Order';
      else if (type === 'Refund') transactionType = 'Refund';
      else if (type === 'Shipping Services' || type === 'Service Fee') transactionType = 'ServiceFee';
      else if (type === 'Reimbursements' || type === 'Debt') transactionType = 'Adjustment';

      const orderId = r['order id'] || '';
      const settlementId = r['settlement id'] || '';
      const dateTime = r['date/time'] || '';

      // Generate a deterministic transaction ID since Amazon doesn't provide line-item IDs in this report
      const rawString = `${settlementId}-${orderId}-${type}-${dateTime}-${r['total']}-${rowIndex}`;
      const transactionId = crypto.createHash('md5').update(rawString).digest('hex');

      // Amounts
      const principal = parseFloatSafe(r['product sales']) + parseFloatSafe(r['promotional rebates']);
      const fees = parseFloatSafe(r['selling fees']) + parseFloatSafe(r['fba fees']);
      
      const taxLiable = parseFloatSafe(r['total sales tax liable(gst before adjusting tcs)']) || parseFloatSafe(r['total sales tax liable']);
      const tcsCgst = parseFloatSafe(r['tcs-cgst']);
      const tcsSgst = parseFloatSafe(r['tcs-sgst']);
      const tcsIgst = parseFloatSafe(r['tcs-igst']);
      const tds = parseFloatSafe(r['tds (section 194-o)']);
      
      const tcsAmount = tcsCgst + tcsSgst + tcsIgst + tds;
      const totalTaxes = taxLiable + tcsAmount;
      
      // Shipping is often tracked in "other" for "Shipping Services", or "shipping credits" for Orders
      let shipping = parseFloatSafe(r['shipping credits']);
      
      // Amazon India puts "Fixed Closing Fee" or "Sales Tax Collection Fee" into 'other transaction fees'.
      // We will classify 'other transaction fees' on an Order row as marketplace fees, instead of an adjustment.
      let otherDeductions = parseFloatSafe(r['other']);
      let transactionFeesAsMarketplaceFee = 0;
      
      if (type === 'Order') {
        transactionFeesAsMarketplaceFee = parseFloatSafe(r['other transaction fees']);
      } else {
        otherDeductions += parseFloatSafe(r['other transaction fees']);
      }

      if (type === 'Shipping Services') {
        shipping += parseFloatSafe(r['other transaction fees']) + parseFloatSafe(r['other']);
        otherDeductions = 0; // Moved to shipping
        transactionFeesAsMarketplaceFee = 0;
      }
      
      const finalFees = fees + transactionFeesAsMarketplaceFee;

      const net = parseFloatSafe(r['total']);

      const transaction: NormalizedSettlementTransaction = {
        marketplaceOrderId: orderId,
        transactionId,
        transactionType,
        transactionDate: new Date(dateTime),
        principalAmount: principal,
        totalMarketplaceFees: finalFees,
        taxLiable: taxLiable,
        tcsAmount: tcsAmount,
        totalTaxes: totalTaxes,
        totalShipping: shipping,
        otherDeductions: otherDeductions,
        netSettlementAmount: net,
        rawTransactionData: row
      };

      normalized.push(transaction);
    }

    return normalized;
  }

  validate(transactions: NormalizedSettlementTransaction[]): ValidationResult {
    const errors: string[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.transactionId) {
        errors.push(`Row ${i}: Missing generated transactionId`);
      }
      if (tx.transactionType === 'Order' && !tx.marketplaceOrderId) {
        errors.push(`Row ${i}: Order transaction missing marketplaceOrderId`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
