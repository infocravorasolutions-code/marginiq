import { Request, Response } from 'express';
import Product from '../models/Product';
import ProductBatch from '../models/ProductBatch';
import { ProfitabilityEngine } from '../services/engines/ProfitabilityEngine';
import { calculateOpportunityScore } from '../services/scoringEngine';
import { LandedCostService } from '../services/costing/LandedCostService';
import { AuthRequest } from '../middlewares/auth';

export const analyzeProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      marketplace,
      category,
      sellingPrice,
      productCost,
      weight,
      dimensions,
      packagingCost,
      advertisingPercent,
      returnPercent,
      shippingType,
      competitionScore,
      returnRisk,
      brandability,
    } = req.body;

    const marketplaceCode = String(marketplace || 'amazon').toLowerCase().includes('flipkart')
      ? 'flipkart'
      : String(marketplace || '').toLowerCase().includes('meesho')
      ? 'meesho'
      : 'amazon';

    const dims = dimensions || {};
    const profInput = {
      marketplaceCode,
      categoryId: category,
      sellingPrice: Number(sellingPrice) || 0,
      productLandedCost: Number(productCost) || 0,
      productGstPercent: 18,
      weight: Number(weight) || 250,
      length: Number(dims.length) || 10,
      width: Number(dims.width) || 10,
      height: Number(dims.height) || 10,
      packagingCost: Number(packagingCost) || 0,
      fulfilmentType: 'fba',
      zone: shippingType || 'national',
      paymentMethod: 'prepaid',
      origin: 'delhi',
      destination: 'mumbai',
      rtoPercent: (Number(returnPercent) || 10) / 2,
      customerReturnPercent: (Number(returnPercent) || 10) / 2,
      damagePercent: 1,
      reimbursementPercent: 50,
      advertisingPercent: Number(advertisingPercent) || 0,
    };

    const profitResult = await ProfitabilityEngine.calculate(profInput);

    const chargeableWeight = Math.max(
      Number(weight) || 0,
      (((Number(dims.length) || 1) * (Number(dims.width) || 1) * (Number(dims.height) || 1)) / 5000) * 1000
    );

    const scoringResult = calculateOpportunityScore({
      netMargin: profitResult.netMargin,
      competitionScore: competitionScore || 'MEDIUM',
      returnRisk: returnRisk || 'LOW',
      shippingWeight: chargeableWeight,
      brandability: brandability || 'MEDIUM',
    });

    res.json({
      success: true,
      analysis: {
        profitability: profitResult,
        opportunity: scoringResult,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query: any = { organizationId: req.user.organizationId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    
    // Also fetch active batches for costing purposes
    const batches = await ProductBatch.find({ 
      productId: product._id, 
      organizationId: req.user.organizationId,
      status: 'Active',
      remainingQuantity: { $gt: 0 }
    }).sort({ receivedDate: -1 });

    res.json({ success: true, data: { ...product.toObject(), batches } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = { ...req.body };
    const purchasePrice = Number(data.purchasePrice) || 0;
    const inboundShipping = Number(data.inboundShipping) || 0;
    const packagingCost = Number(data.packagingCost) || 0;
    const labelCost = Number(data.labelCost) || 0;
    const inspectionCost = Number(data.inspectionCost) || 0;
    const otherProcurementCost = Number(data.otherProcurementCost) || 0;

    if (!data.defaultLandedCost || data.defaultLandedCost === purchasePrice) {
      data.defaultLandedCost = LandedCostService.calculateUnitLandedCost({
        purchaseCost: purchasePrice,
        inboundFreight: inboundShipping,
        packagingCost,
        labelCost,
        inspectionCost,
        otherCosts: otherProcurementCost
      }).totalLandedCost;
    }

    const newProduct = new Product({
      ...data,
      organizationId: req.user.organizationId,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, data: savedProduct });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
