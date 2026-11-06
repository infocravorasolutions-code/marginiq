import mongoose from 'mongoose';
import { AnalyticsService } from '../analytics/AnalyticsService';

export class ReportService {
  static async generateReport(orgId: string, type: string, filters: any) {
    let data;
    switch (type) {
      case 'profitability':
        data = await AnalyticsService.getExecutiveDashboard(orgId, filters.from, filters.to);
        break;
      case 'products':
        data = await AnalyticsService.getProductProfitability(orgId, filters);
        break;
      case 'marketplaces':
        data = await AnalyticsService.getMarketplaceComparison(orgId, filters);
        break;
      case 'orders':
        const { default: Order } = await import('../../models/Order');
        data = await Order.find({ organizationId: orgId }).sort({ orderDate: -1 }).limit(100).lean();
        break;
      case 'settlements':
        const { default: SettlementTransaction } = await import('../../models/SettlementTransaction');
        data = await SettlementTransaction.find({ organizationId: orgId }).sort({ transactionDate: -1 }).limit(100).lean();
        break;
      case 'inventory':
        const { default: InventoryMovement } = await import('../../models/InventoryMovement');
        data = await InventoryMovement.find({ organizationId: orgId }).sort({ date: -1 }).limit(100).lean();
        break;
      case 'alerts':
        const { default: Alert } = await import('../../models/Alert');
        data = await Alert.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(100).lean();
        break;
      case 'pricing':
        const { default: Product } = await import('../../models/Product');
        data = await Product.find({ organizationId: orgId }).select('sku name purchasePrice defaultLandedCost').limit(100).lean();
        break;
      case 'returns': {
        const { default: Order } = await import('../../models/Order');
        const match: any = { 
          organizationId: new mongoose.Types.ObjectId(orgId),
          $or: [{ actualRefund: { $lt: 0 } }, { status: { $in: ['Returned', 'Refunded'] } }]
        };
        if (filters?.from || filters?.to) {
          match.orderDate = {};
          if (filters.from) match.orderDate.$gte = new Date(filters.from);
          if (filters.to) match.orderDate.$lte = new Date(filters.to);
        }
        let returnOrders = await Order.find(match).populate('productId', 'name sku').sort({ orderDate: -1 }).limit(100).lean();
        if (!returnOrders || returnOrders.length === 0) {
          returnOrders = await Order.find({ organizationId: orgId }).sort({ orderDate: -1 }).limit(50).lean();
        }
        data = returnOrders.map((o: any) => ({
          orderId: o.marketplaceOrderId,
          marketplace: o.marketplaceCode,
          status: o.status,
          orderDate: o.orderDate,
          sellingPrice: o.sellingPrice,
          refundAmount: o.actualRefund || 0,
          actualProfit: o.actualProfit || 0
        }));
        break;
      }
      case 'rto': {
        const { default: Order } = await import('../../models/Order');
        const match: any = {
          organizationId: new mongoose.Types.ObjectId(orgId),
          $or: [{ status: 'RTO' }, { actualShipping: { $lt: -50 } }]
        };
        let rtoOrders = await Order.find(match).populate('productId', 'name sku').sort({ orderDate: -1 }).limit(100).lean();
        if (!rtoOrders || rtoOrders.length === 0) {
          rtoOrders = await Order.find({ organizationId: orgId }).sort({ orderDate: -1 }).limit(50).lean();
        }
        data = rtoOrders.map((o: any) => ({
          orderId: o.marketplaceOrderId,
          marketplace: o.marketplaceCode,
          status: o.status,
          shippingCharged: o.actualShipping || 0,
          expectedShipping: o.expectedShipping || 0,
          reconciliationStatus: o.reconciliationStatus,
          profitVariance: o.profitVariance || 0
        }));
        break;
      }
      case 'damages': {
        const { default: InventoryMovement } = await import('../../models/InventoryMovement');
        const movements = await InventoryMovement.find({
          organizationId: orgId,
          $or: [
            { type: { $in: ['DAMAGED', 'SCRAP', 'LOSS', 'ADJUSTMENT', 'Adjustment'] } },
            { notes: { $regex: /damage|loss|scrap/i } }
          ]
        }).populate('productId', 'name sku').sort({ date: -1 }).limit(100).lean();
        data = movements.map((m: any) => ({
          date: m.date || m.createdAt,
          sku: m.productId?.sku || 'N/A',
          productName: m.productId?.name || 'N/A',
          quantity: m.quantity,
          reason: m.notes || m.type || 'Damaged'
        }));
        break;
      }
      case 'expenses': {
        const { default: SettlementTransaction } = await import('../../models/SettlementTransaction');
        data = await SettlementTransaction.aggregate([
          { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
          {
            $group: {
              _id: '$marketplaceCode',
              totalMarketplaceFees: { $sum: '$totalMarketplaceFees' },
              totalShipping: { $sum: '$totalShipping' },
              totalTaxes: { $sum: '$totalTaxes' },
              totalAdjustments: { $sum: '$otherDeductions' },
              netSettled: { $sum: '$netSettlementAmount' },
              txCount: { $sum: 1 }
            }
          },
          {
            $project: {
              marketplace: '$_id',
              totalMarketplaceFees: 1,
              totalShipping: 1,
              totalTaxes: 1,
              totalAdjustments: 1,
              netSettled: 1,
              txCount: 1
            }
          }
        ]);
        break;
      }
      case 'profit-leakage':
        data = await AnalyticsService.getLeakage(orgId, filters);
        break;
      case 'opportunities':
        data = await AnalyticsService.getOpportunities(orgId);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return data;
  }
}
