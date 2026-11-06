import mongoose from 'mongoose';
import Alert from '../../models/Alert';
import Order from '../../models/Order';
import Product from '../../models/Product';

export class AlertService {
  static async evaluateRules(orgId: string) {
    const alertsToCreate: any[] = [];
    
    // Rule 1: Loss Making Products
    const lossProducts = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
      {
        $group: {
          _id: '$productId',
          profit: { $sum: { $ifNull: ['$actualProfit', 0] } }
        }
      },
      { $match: { profit: { $lt: 0 } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' }
    ]);

    for (const lp of lossProducts) {
      alertsToCreate.push({
        organizationId: orgId,
        type: 'LOSS_MAKING_PRODUCT',
        severity: 'CRITICAL',
        title: 'Loss Making Product Detected',
        message: `Product ${lp.product.sku} has an accumulated actual profit of ₹${lp.profit.toFixed(2)}.`,
        entityType: 'Product',
        entityId: lp._id.toString(),
        metric: 'actualProfit',
        actualValue: lp.profit
      });
    }

    // Rule 2: Settlement Variance
    const varianceOrders = await Order.find({
      organizationId: orgId,
      reconciliationStatus: 'Variance',
      profitVariance: { $lt: -50 } // material variance threshold
    });

    for (const vo of varianceOrders) {
      alertsToCreate.push({
        organizationId: orgId,
        type: 'SETTLEMENT_VARIANCE',
        severity: 'WARNING',
        title: 'Material Settlement Variance',
        message: `Order ${vo.marketplaceOrderId} has a profit variance of ₹${vo.profitVariance}.`,
        entityType: 'Order',
        entityId: vo._id.toString(),
        metric: 'profitVariance',
        actualValue: vo.profitVariance
      });
    }

    // Insert ignoring duplicates via the partial unique index
    let inserted = 0;
    for (const a of alertsToCreate) {
      try {
        await Alert.create(a);
        inserted++;
      } catch (err: any) {
        if (err.code !== 11000) console.error(err);
      }
    }
    return inserted;
  }

  static async getAlerts(orgId: string, status: string = 'UNREAD') {
    return Alert.find({ organizationId: orgId, status } as any).sort({ createdAt: -1 });
  }

  static async markRead(alertId: string, orgId: string) {
    return Alert.findOneAndUpdate({ _id: alertId, organizationId: orgId } as any, { status: 'READ' }, { new: true });
  }
  
  static async resolve(alertId: string, orgId: string) {
    return Alert.findOneAndUpdate({ _id: alertId, organizationId: orgId } as any, { status: 'RESOLVED', resolvedAt: new Date() }, { new: true });
  }
}
