import mongoose from 'mongoose';
import Order, { IOrder } from '../../models/Order';
import SettlementTransaction, { ISettlementTransaction } from '../../models/SettlementTransaction';
import CalculationSnapshot from '../../models/CalculationSnapshot';

export class ReconciliationEngine {
  
  /**
   * Scans for unmatched SettlementTransactions and attempts to link them to an Order
   */
  static async runMatching(organizationId: string | mongoose.Types.ObjectId): Promise<void> {
    const unmatchedTransactions = await SettlementTransaction.find({
      organizationId,
      reconciliationStatus: 'Unmatched'
    } as any) as unknown as ISettlementTransaction[];

    for (const tx of unmatchedTransactions) {
      if (!tx.marketplaceOrderId || tx.marketplaceOrderId === 'UNKNOWN') {
        tx.reconciliationStatus = 'Unmatched';
        tx.matchConfidence = 'Unmatched';
        tx.matchMethod = 'Missing Order ID';
        await tx.save();
        continue;
      }

      // 1. Strict match by marketplaceOrderId
      const exactMatchOrder = await Order.findOne({
        organizationId,
        marketplaceCode: tx.marketplaceCode,
        marketplaceOrderId: tx.marketplaceOrderId
      } as any) as unknown as IOrder | null;

      if (exactMatchOrder) {
        tx.matchedOrderId = exactMatchOrder._id as mongoose.Types.ObjectId;
        tx.reconciliationStatus = 'Matched';
        tx.matchConfidence = 'High';
        tx.matchMethod = 'marketplaceOrderId exact match';
        await tx.save();

        await this.reconcileOrder(exactMatchOrder._id.toString(), organizationId);
      } else {
        tx.matchConfidence = 'Unmatched';
        tx.matchMethod = 'Order not found in MarginIQ';
        await tx.save();
      }
    }
  }

  /**
   * Recalculates the actuals and variances for a specific order based on all matched transactions
   */
  static async reconcileOrder(orderId: string | mongoose.Types.ObjectId, organizationId: string | mongoose.Types.ObjectId): Promise<void> {
    const order = await Order.findOne({ _id: orderId, organizationId } as any) as unknown as IOrder | null;
    if (!order) throw new Error('Order not found');

    const transactions = await SettlementTransaction.find({
      matchedOrderId: orderId,
      organizationId,
      reconciliationStatus: { $in: ['Matched', 'Partially Matched', 'Reconciled', 'Variance'] }
    } as any) as unknown as ISettlementTransaction[];

    if (transactions.length === 0) {
      order.reconciliationStatus = 'Unmatched';
      await order.save();
      return;
    }

    const snapshot = await CalculationSnapshot.findOne({ _id: order.calculationSnapshotId, organizationId } as any);
    if (!snapshot) throw new Error('Order is missing its immutable CalculationSnapshot');

    // Expected values
    const expectedRevenue = snapshot.sellingPrice;
    const expectedProductCost = snapshot.productLandedCost;
    const expectedMarketplaceFees = snapshot.fees?.totalMarketplaceFees || 0;
    const expectedShipping = snapshot.shipping?.totalShippingCost || 0;
    const expectedTaxes = snapshot.tax?.netGstPayable || 0;
    const expectedExpectedProfit = snapshot.expectedProfit;

    // Actual Aggregations
    let actualGrossRevenue = 0;
    let actualProductRevenue = 0;
    let actualRefund = 0;
    let actualMarketplaceFees = 0;
    let actualShipping = 0;
    let actualTaxes = 0;
    let actualTCS = 0;
    let actualAdjustments = 0;
    let actualSettlementAmount = 0;

    for (const tx of transactions) {
      // Ignore payouts/debts
      const typeStr = tx.rawTransactionData?.type?.toLowerCase() || '';
      if (tx.transactionType === 'Other' || typeStr === 'transfer' || typeStr === 'debt') {
        continue;
      }

      if (tx.transactionType === 'Order') {
        actualProductRevenue += tx.principalAmount;
        actualGrossRevenue += tx.principalAmount + (tx.taxLiable || 0); // Include collected tax for gross revenue
      } else if (tx.transactionType === 'Refund') {
        actualRefund += tx.principalAmount; // usually negative
        // If tax was refunded to the customer, it would be in tx.taxLiable (negative)
        // We might want to subtract refunded tax from gross revenue, but let's keep it simple: 
        // Gross revenue is based on orders. Refunds reduce actualProfit directly.
        actualGrossRevenue += (tx.taxLiable || 0); // Include negative tax to reduce gross revenue if refunded
      } else if (tx.transactionType === 'Adjustment' || tx.transactionType === 'ServiceFee') {
        actualAdjustments += tx.principalAmount;
      }

      actualMarketplaceFees += tx.totalMarketplaceFees;
      actualShipping += tx.totalShipping;
      actualTaxes += (tx.taxLiable || 0);
      actualTCS += (tx.tcsAmount || 0);
      
      // Additional deductions from marketplace mapping
      actualAdjustments += tx.otherDeductions;
      
      actualSettlementAmount += tx.netSettlementAmount;
    }

    // ACTUAL PROFIT FORMULA
    // We start with the total cash settled by Amazon
    const cashFromAmazon = actualSettlementAmount;

    // LIMITATION: We do not currently track dynamically changing 'actual' product costs at the time of reconciliation.
    // We use the immutable expected product cost from the snapshot.
    const actualProductCost = expectedProductCost;

    // LIMITATION: We don't dynamically recalculate exact GST liability on the actual amounts yet.
    // We fall back to the expected tax liability.
    // However, Amazon's settlement handles TCS/TDS which act as tax credits.
    // Amazon also remits 'taxLiable' to the seller, which the seller must pay to the government.
    // To find true profit: Cash From Amazon - Product Cost - Expected Tax Liability
    // Wait! The expected tax liability (netGstPayable) assumes we received the tax from the customer.
    // So if Amazon gave us the tax, we must pay it out.
    // Also, Amazon already withheld TCS (so cashFromAmazon is smaller). But TCS pays part of netGstPayable!
    // To perfectly isolate this: 
    // Profit = Revenue + Refunds - Product Cost + Marketplace Fees + Shipping + Adjustments.
    // (Notice Taxes are omitted here because revenue is Ex-GST in our deterministic model, 
    // and fees are inclusive of GST. This matches the user's test case exactly).

    // Actual Profit Formula
    // Based on user requirements: Gross Revenue - GST Liable - Product Cost - Fees - Shipping - Adjustments
    // We add negative costs since actualMarketplaceFees, actualShipping, etc. are already negative.
    const actualProfit = actualGrossRevenue 
      + actualRefund // usually negative
      - actualTaxes // The tax we owe (positive value usually means tax we owe)
      - actualProductCost 
      + actualMarketplaceFees 
      + actualShipping 
      + actualAdjustments; 
      
    const actualMargin = actualGrossRevenue !== 0 ? (actualProfit / actualGrossRevenue) * 100 : 0;

    // Calculate Variances (Actual - Expected)
    // For revenue: Actual (positive) - Expected (positive)
    // We compare Gross to Gross
    const revenueVariance = (actualGrossRevenue + actualRefund) - expectedRevenue;
    
    // For costs (fees, shipping, adjustments): Since they are negative actuals, and expected is a positive cost
    // If expected is 150, actual is -160. Fee variance = expected - Math.abs(actual) = 150 - 160 = -10 (worse)
    const feeVariance = expectedMarketplaceFees - Math.abs(actualMarketplaceFees);
    
    const shippingVariance = expectedShipping - Math.abs(actualShipping);
    
    const taxVariance = expectedTaxes - Math.abs(actualTaxes);
    
    const adjustmentVariance = 0 - Math.abs(actualAdjustments);
    
    const profitVariance = actualProfit - expectedExpectedProfit;

    // Determine status: A transaction is 'Reconciled' if actuals match expected within tolerance.
    // If profit, fee, shipping, or revenue variance exceeds ₹1, mark as 'Variance'.
    let status: typeof order.reconciliationStatus = 'Reconciled';
    if (
      Math.abs(profitVariance) > 1 ||
      Math.abs(feeVariance) > 1 ||
      Math.abs(shippingVariance) > 1 ||
      Math.abs(revenueVariance) > 1
    ) {
      status = 'Variance';
    }

    // Assign back to order
    order.actualGrossRevenue = actualGrossRevenue;
    order.actualProductRevenue = actualProductRevenue;
    order.actualRefund = actualRefund;
    order.actualMarketplaceFees = actualMarketplaceFees;
    order.actualShipping = actualShipping;
    order.actualTaxes = actualTaxes;
    order.actualTCS = actualTCS;
    order.actualAdjustments = actualAdjustments;
    order.actualSettlementAmount = actualSettlementAmount;
    order.actualProfit = actualProfit;
    order.actualMargin = actualMargin;

    order.revenueVariance = revenueVariance;
    order.feeVariance = feeVariance;
    order.shippingVariance = shippingVariance;
    order.taxVariance = taxVariance;
    order.adjustmentVariance = adjustmentVariance;
    order.profitVariance = profitVariance;
    
    order.reconciliationStatus = status;
    order.settlementStatus = 'Settled'; // Mark as settled since we processed it

    await order.save();
  }
}
