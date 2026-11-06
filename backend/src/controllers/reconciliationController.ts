import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ReconciliationEngine } from '../services/reconciliation/ReconciliationEngine';
import Order, { IOrder } from '../models/Order';
import SettlementTransaction, { ISettlementTransaction } from '../models/SettlementTransaction';

export const runReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ReconciliationEngine.runMatching(req.user.organizationId);
    
    // Get summary of results
    const matchedCount = await SettlementTransaction.countDocuments({
      organizationId: req.user.organizationId,
      reconciliationStatus: { $in: ['Matched', 'Partially Matched'] }
    } as any);
    
    const unmatchedCount = await SettlementTransaction.countDocuments({
      organizationId: req.user.organizationId,
      reconciliationStatus: 'Unmatched'
    } as any);

    res.json({ 
      success: true, 
      message: 'Reconciliation matching completed successfully',
      data: {
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReconciliationSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalOrders = await Order.countDocuments({ organizationId: req.user.organizationId } as any);
    const reconciledOrders = await Order.countDocuments({ 
      organizationId: req.user.organizationId,
      reconciliationStatus: { $in: ['Reconciled', 'Variance'] }
    } as any);
    
    const unmatchedTransactions = await SettlementTransaction.countDocuments({
      organizationId: req.user.organizationId,
      reconciliationStatus: 'Unmatched'
    } as any);

    res.json({
      success: true,
      data: {
        totalOrders,
        reconciledOrders,
        pendingOrders: totalOrders - reconciledOrders,
        unmatchedTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ _id: orderId, organizationId: req.user.organizationId } as any)
      .populate('calculationSnapshotId')
      .populate('productId', 'name sku') as unknown as IOrder | null;
      
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const transactions = await SettlementTransaction.find({ 
      matchedOrderId: order._id,
      organizationId: req.user.organizationId 
    } as any).sort({ transactionDate: 1 }) as unknown as ISettlementTransaction[];

    res.json({
      success: true,
      data: {
        order,
        transactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnmatchedTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await SettlementTransaction.find({
      organizationId: req.user.organizationId,
      reconciliationStatus: 'Unmatched'
    } as any).sort({ transactionDate: -1 }).limit(100) as unknown as ISettlementTransaction[];

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
