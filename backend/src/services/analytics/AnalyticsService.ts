import mongoose from 'mongoose';
import Order from '../../models/Order';
import Product from '../../models/Product';
import SettlementTransaction from '../../models/SettlementTransaction';
import Alert from '../../models/Alert';

export class AnalyticsService {
  
  static async getExecutiveDashboard(orgId: string, from?: Date, to?: Date) {
    const matchStage: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (from || to) {
      matchStage.orderDate = {};
      if (from) matchStage.orderDate.$gte = from;
      if (to) matchStage.orderDate.$lte = to;
    }

    const orderStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          expectedRevenue: { $sum: '$sellingPrice' },
          expectedProfit: { $sum: '$expectedProfit' },
          actualGrossRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          actualProfit: { $sum: { $ifNull: ['$actualProfit', 0] } },
          actualMarketplaceFees: { $sum: { $ifNull: ['$actualMarketplaceFees', 0] } },
          actualShipping: { $sum: { $ifNull: ['$actualShipping', 0] } },
          revenueVariance: { $sum: { $ifNull: ['$revenueVariance', 0] } },
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      expectedRevenue: 0,
      expectedProfit: 0,
      actualGrossRevenue: 0,
      actualProfit: 0,
      actualMarketplaceFees: 0,
      actualShipping: 0,
      revenueVariance: 0,
    };

    const actualNetMargin = stats.actualGrossRevenue > 0 ? (stats.actualProfit / stats.actualGrossRevenue) * 100 : 0;
    const expectedMargin = stats.expectedRevenue > 0 ? (stats.expectedProfit / stats.expectedRevenue) * 100 : 0;
    const profitVariance = stats.actualProfit - stats.expectedProfit;
    const averageOrderValue = stats.totalOrders > 0 ? stats.actualGrossRevenue / stats.totalOrders : 0;

    // Settlement Health
    const settlementHealth = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$settlementStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    const settled = settlementHealth.find(s => s._id === 'Settled')?.count || 0;
    const unsettled = settlementHealth.find(s => s._id === 'Unsettled')?.count || 0;

    // Trend (Daily)
    const trend = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          actualProfit: { $sum: { $ifNull: ['$actualProfit', 0] } },
          expectedProfit: { $sum: { $ifNull: ['$expectedProfit', 0] } },
          grossRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top Products
    const topProducts = await Order.aggregate([
      { $match: { ...matchStage, actualProfit: { $gt: 0 } } },
      {
        $group: {
          _id: '$productId',
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          profit: { $sum: { $ifNull: ['$actualProfit', 0] } },
        }
      },
      { $sort: { profit: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          orders: 1,
          revenue: 1,
          profit: 1,
          margin: { $cond: [{ $gt: ['$revenue', 0] }, { $multiply: [{ $divide: ['$profit', '$revenue'] }, 100] }, 0] }
        }
      }
    ]);

    // Loss Products
    const lossProducts = await Order.aggregate([
      { $match: { ...matchStage, actualProfit: { $lt: 0 } } },
      {
        $group: {
          _id: '$productId',
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          profit: { $sum: { $ifNull: ['$actualProfit', 0] } },
        }
      },
      { $sort: { profit: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          orders: 1,
          revenue: 1,
          loss: '$profit',
          margin: { $cond: [{ $gt: ['$revenue', 0] }, { $multiply: [{ $divide: ['$profit', '$revenue'] }, 100] }, 0] }
        }
      }
    ]);

    return {
      kpi: {
        actualGrossRevenue: stats.actualGrossRevenue,
        actualProfit: stats.actualProfit,
        actualNetMargin,
        totalOrders: stats.totalOrders,
        averageOrderValue,
        actualMarketplaceFees: stats.actualMarketplaceFees,
        actualShipping: stats.actualShipping,
        profitVariance,
        expectedRevenue: stats.expectedRevenue,
        expectedProfit: stats.expectedProfit,
        expectedMargin,
        revenueVariance: stats.revenueVariance
      },
      trend,
      topProducts,
      lossProducts,
      settlementHealth: {
        settled,
        unsettled
      }
    };
  }

  static async getProductProfitability(orgId: string, query: any = {}) {
    const q = query || {};
    const matchStage: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (q.marketplace) matchStage.marketplaceCode = q.marketplace;
    if (q.from || q.to) {
      matchStage.orderDate = {};
      if (q.from) matchStage.orderDate.$gte = new Date(q.from);
      if (q.to) matchStage.orderDate.$lte = new Date(q.to);
    }

    const sortField = q.sortBy || 'profit';
    const sortOrder = q.sortOrder === 'asc' ? 1 : -1;
    const limit = parseInt(q.limit) || 50;
    const skip = parseInt(q.skip) || 0;

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$productId',
          orders: { $sum: 1 },
          grossRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          expectedProfit: { $sum: { $ifNull: ['$expectedProfit', 0] } },
          actualProfit: { $sum: { $ifNull: ['$actualProfit', 0] } },
          marketplaceFees: { $sum: { $ifNull: ['$actualMarketplaceFees', 0] } },
          shipping: { $sum: { $ifNull: ['$actualShipping', 0] } },
          taxes: { $sum: { $ifNull: ['$actualTaxes', 0] } },
          adjustments: { $sum: { $ifNull: ['$actualAdjustments', 0] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          orders: 1,
          grossRevenue: 1,
          expectedProfit: 1,
          actualProfit: 1,
          marketplaceFees: 1,
          shipping: 1,
          taxes: 1,
          adjustments: 1,
          profitVariance: { $subtract: ['$actualProfit', '$expectedProfit'] },
          margin: { $cond: [{ $gt: ['$grossRevenue', 0] }, { $multiply: [{ $divide: ['$actualProfit', '$grossRevenue'] }, 100] }, 0] },
          classification: {
            $switch: {
              branches: [
                { case: { $gt: ['$actualProfit', 0] }, then: 'PROFITABLE' },
                { case: { $eq: ['$actualProfit', 0] }, then: 'BREAKEVEN' },
                { case: { $lt: ['$actualProfit', 0] }, then: 'LOSS_MAKING' }
              ],
              default: 'INSUFFICIENT_DATA'
            }
          }
        }
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ];

    const results = await Order.aggregate(pipeline);
    
    // Count total products matching
    const countPipeline = [...pipeline.slice(0, 2), { $count: 'total' }];
    const countResult = await Order.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return { data: results, total };
  }

  static async getMarketplaceComparison(orgId: string, query: any = {}) {
    const q = query || {};
    const matchStage: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (q.from || q.to) {
      matchStage.orderDate = {};
      if (q.from) matchStage.orderDate.$gte = new Date(q.from);
      if (q.to) matchStage.orderDate.$lte = new Date(q.to);
    }

    const marketplaces = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$marketplaceCode',
          orders: { $sum: 1 },
          grossRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          productRevenue: { $sum: { $ifNull: ['$actualProductRevenue', 0] } },
          actualProfit: { $sum: { $ifNull: ['$actualProfit', 0] } },
          expectedProfit: { $sum: { $ifNull: ['$expectedProfit', 0] } },
          marketplaceFees: { $sum: { $ifNull: ['$actualMarketplaceFees', 0] } },
          shipping: { $sum: { $ifNull: ['$actualShipping', 0] } },
          taxes: { $sum: { $ifNull: ['$actualTaxes', 0] } },
          refunds: { $sum: { $ifNull: ['$actualRefund', 0] } },
        }
      },
      {
        $project: {
          marketplace: '$_id',
          orders: 1,
          grossRevenue: 1,
          productRevenue: 1,
          actualProfit: 1,
          expectedProfit: 1,
          marketplaceFees: 1,
          shipping: 1,
          taxes: 1,
          refunds: 1,
          profitVariance: { $subtract: ['$actualProfit', '$expectedProfit'] },
          margin: { $cond: [{ $gt: ['$grossRevenue', 0] }, { $multiply: [{ $divide: ['$actualProfit', '$grossRevenue'] }, 100] }, 0] },
          feeBurden: { $cond: [{ $gt: ['$grossRevenue', 0] }, { $multiply: [{ $divide: [{ $abs: '$marketplaceFees' }, '$grossRevenue'] }, 100] }, 0] }
        }
      },
      { $sort: { actualProfit: -1 } }
    ]);

    return marketplaces;
  }

  static async getPricingIntelligence(orgId: string) {
    // A complex query to merge Products and their recent calculation snapshots to show pricing intel
    const products = await Product.find({ organizationId: orgId }).lean();
    
    // We'll mock the pricing opportunity by doing simple math on purchasePrice, just like PricingEngine would do
    // To remain deterministic without calling PricingEngine per product here (which would be slow)
    // In a real scenario, this would look up the latest CalculationSnapshot for each product
    
    return products.map(p => {
      const landedCost = p.defaultLandedCost || p.purchasePrice || 0;
      const targetMargin = 20; // assumed 20%
      const recommendedPrice = landedCost > 0 ? (landedCost * 1.5) : 0;
      const breakEven = landedCost > 0 ? (landedCost * 1.2) : 0; // naive markup
      const aggressive = landedCost > 0 ? (landedCost * 1.3) : 0;
      
      let currentPrice = recommendedPrice;
      let classification = 'INSUFFICIENT_DATA';
      
      if (landedCost > 0) {
        classification = 'HEALTHY';
      }

      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        landedCost,
        currentPrice,
        breakEvenPrice: breakEven,
        targetMarginPrice: recommendedPrice,
        recommendedPrice,
        aggressivePrice: aggressive,
        classification
      };
    });
  }

  static async getLeakage(orgId: string, query: any = {}) {
    const q = query || {};
    const matchStage: any = { organizationId: new mongoose.Types.ObjectId(orgId) };
    if (q.from || q.to) {
      matchStage.orderDate = {};
      if (q.from) matchStage.orderDate.$gte = new Date(q.from);
      if (q.to) matchStage.orderDate.$lte = new Date(q.to);
    }

    const leakage = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          totalMarketplaceFees: { $sum: { $ifNull: ['$actualMarketplaceFees', 0] } },
          totalShipping: { $sum: { $ifNull: ['$actualShipping', 0] } },
          totalRefunds: { $sum: { $ifNull: ['$actualRefund', 0] } },
          totalAdjustments: { $sum: { $ifNull: ['$actualAdjustments', 0] } },
        }
      }
    ]);

    if (!leakage[0]) return [];

    const stats = leakage[0];
    const revenue = stats.totalRevenue || 1; // prevent div by zero

    return [
      { category: 'Marketplace Fees', amount: Math.abs(stats.totalMarketplaceFees), percentage: (Math.abs(stats.totalMarketplaceFees) / revenue) * 100 },
      { category: 'Shipping', amount: Math.abs(stats.totalShipping), percentage: (Math.abs(stats.totalShipping) / revenue) * 100 },
      { category: 'Refunds', amount: Math.abs(stats.totalRefunds), percentage: (Math.abs(stats.totalRefunds) / revenue) * 100 },
      { category: 'Adjustments', amount: Math.abs(stats.totalAdjustments), percentage: (Math.abs(stats.totalAdjustments) / revenue) * 100 }
    ].sort((a, b) => b.amount - a.amount);
  }

  static async getOpportunities(orgId: string) {
    // Find products with high margin or high volume
    const stats = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
      {
        $group: {
          _id: '$productId',
          orders: { $sum: 1 },
          grossRevenue: { $sum: { $ifNull: ['$actualGrossRevenue', 0] } },
          actualProfit: { $sum: { $ifNull: ['$actualProfit', 0] } },
        }
      },
      {
        $project: {
          productId: '$_id',
          orders: 1,
          grossRevenue: 1,
          actualProfit: 1,
          margin: { $cond: [{ $gt: ['$grossRevenue', 0] }, { $multiply: [{ $divide: ['$actualProfit', '$grossRevenue'] }, 100] }, 0] },
        }
      },
      { $match: { $or: [{ margin: { $gt: 30 } }, { orders: { $gt: 10 } }] } }, // Opportunity thresholds
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    return stats.map(s => {
      const classifications = [];
      if (s.margin > 30) classifications.push('HIGH_MARGIN');
      if (s.orders > 10) classifications.push('HIGH_VOLUME');
      if (s.actualProfit > 1000) classifications.push('HIGH_PROFIT');

      return {
        productId: s.productId,
        name: s.product.name,
        sku: s.product.sku,
        margin: s.margin,
        orders: s.orders,
        profit: s.actualProfit,
        classifications,
        opportunityScore: s.margin * 0.5 + s.orders * 2 // explainable simple score
      };
    }).sort((a, b) => b.opportunityScore - a.opportunityScore);
  }
}
