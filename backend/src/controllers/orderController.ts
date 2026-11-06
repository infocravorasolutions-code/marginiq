import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Order from '../models/Order';
import CalculationSnapshot from '../models/CalculationSnapshot';
import { ProfitabilityEngine, ProfitabilityInput } from '../services/engines/ProfitabilityEngine';
import Product from '../models/Product';
import ProductBatch from '../models/ProductBatch';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      marketplaceCode, 
      marketplaceOrderId, 
      productId, 
      orderDate, 
      sellingPrice, 
      discountAmount,
      isGstRegistered,
      productCostIncludesGst,
      fulfilmentType,
      zone,
      paymentMethod,
      origin,
      destination,
      rtoPercent,
      customerReturnPercent,
      damagePercent,
      reimbursementPercent,
      advertisingPercent
    } = req.body;

    // Validate inputs
    if (!marketplaceCode || !marketplaceOrderId || !productId || !sellingPrice) {
      res.status(400).json({ success: false, message: 'Missing required order fields' });
      return;
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({ 
      organizationId: req.user.organizationId, 
      marketplaceCode, 
      marketplaceOrderId 
    });

    if (existingOrder) {
      res.status(409).json({ success: false, message: 'Order already exists' });
      return;
    }

    // Fetch product to get cost
    const product = await Product.findOne({ _id: productId, organizationId: req.user.organizationId });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Fetch active batch for cost or fallback to default
    const batches = await ProductBatch.find({ 
      productId: product._id, 
      organizationId: req.user.organizationId,
      status: 'Active',
      remainingQuantity: { $gt: 0 }
    }).sort({ receivedDate: -1 });

    const productLandedCost = batches.length > 0 ? batches[0].landedCost : (product.defaultLandedCost || product.purchasePrice || 0);

    // Build profitability input
    const profitabilityInput: ProfitabilityInput = {
      marketplaceCode,
      categoryId: product.category,
      sellingPrice,
      productLandedCost,
      productGstPercent: product.gstRate || 18,
      isGstRegistered: isGstRegistered ?? true,
      productCostIncludesGst: productCostIncludesGst ?? true,
      weight: product.weight || 500,
      length: product.dimensions?.length || 10,
      width: product.dimensions?.width || 10,
      height: product.dimensions?.height || 10,
      packagingCost: product.packagingCost || 10,
      fulfilmentType: fulfilmentType || 'Easy Ship',
      zone: zone || 'National',
      paymentMethod: paymentMethod || 'Prepaid',
      origin: origin || 'Delhi',
      destination: destination || 'Mumbai',
      rtoPercent: rtoPercent || 5,
      customerReturnPercent: customerReturnPercent || 10,
      damagePercent: damagePercent || 2,
      reimbursementPercent: reimbursementPercent || 40,
      advertisingPercent: advertisingPercent || 0,
      couponFixed: discountAmount || 0,
    };

    // Calculate expected profitability
    const expectedProfitability = await ProfitabilityEngine.calculate(profitabilityInput);

    // Save Immutable Calculation Snapshot
    const snapshot = new CalculationSnapshot({
      organizationId: req.user.organizationId,
      marketplaceCode,
      sellingPrice,
      productLandedCost,
      fees: expectedProfitability.fees,
      shipping: expectedProfitability.shipping,
      returns: expectedProfitability.returns,
      damage: expectedProfitability.damage,
      advertising: expectedProfitability.advertising,
      discounts: expectedProfitability.discounts,
      tax: expectedProfitability.tax,
      totalCost: expectedProfitability.totalCost,
      expectedProfit: expectedProfitability.netProfit,
      expectedMargin: expectedProfitability.netMargin,
      feeRuleVersionsApplied: [], // Should collect from engine response in future
      calculationVersion: '1.0'
    });

    const savedSnapshot = await snapshot.save();

    // Create Order
    const order = new Order({
      organizationId: req.user.organizationId,
      marketplaceCode,
      marketplaceOrderId,
      productId,
      orderDate: orderDate || new Date(),
      status: 'Pending',
      settlementStatus: 'Unsettled',
      sellingPrice,
      discountAmount: discountAmount || 0,
      calculationSnapshotId: savedSnapshot._id,
      expectedProfit: expectedProfitability.netProfit
    });

    const savedOrder = await order.save();

    res.status(201).json({ 
      success: true, 
      data: savedOrder,
      snapshot: savedSnapshot
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ organizationId: req.user.organizationId })
      .populate('productId', 'name sku')
      .sort({ orderDate: -1 })
      .limit(50);
      
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
