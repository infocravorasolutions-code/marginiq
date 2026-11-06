import { Response } from 'express';
import Purchase from '../models/Purchase';
import ProductBatch from '../models/ProductBatch';
import { AuthRequest } from '../middlewares/auth';
import { LandedCostService } from '../services/costing/LandedCostService';

export const getPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchases = await Purchase.find({ organizationId: req.user.organizationId })
      .populate('supplierId', 'companyName')
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      purchaseOrderNumber,
      supplierId,
      status,
      orderDate,
      items,
      shippingCost,
      otherCosts,
      packagingCost,
      labelCost,
      inspectionCost,
      paymentStatus,
      notes
    } = req.body;

    const orgId = req.user.organizationId;
    const poNumber = purchaseOrderNumber || `PO-${Date.now()}`;

    const purchaseItems = (items || []).map((it: any) => ({
      productId: it.productId,
      quantity: Number(it.quantity) || 1,
      unitCost: Number(it.unitCost ?? it.purchaseCost) || 0,
      totalCost: (Number(it.quantity) || 1) * (Number(it.unitCost ?? it.purchaseCost) || 0),
      packagingCost: Number(it.packagingCost) || 0,
      labelCost: Number(it.labelCost) || 0
    }));

    const subtotal = purchaseItems.reduce((acc: number, it: any) => acc + it.totalCost, 0);
    const freight = Number(shippingCost) || 0;
    const other = Number(otherCosts) || 0;
    const totalAmount = subtotal + freight + other;

    const newPurchase = new Purchase({
      organizationId: orgId,
      purchaseOrderNumber: poNumber,
      supplierId,
      status: status || 'Received',
      orderDate: orderDate || new Date(),
      items: purchaseItems,
      subtotal,
      shippingCost: freight,
      otherCosts: other,
      totalAmount,
      paymentStatus: paymentStatus || 'Pending',
      notes
    });

    const savedPurchase = await newPurchase.save();

    // Create batches for each purchase item
    const createdBatches: any[] = [];
    const allocatedItems = LandedCostService.allocatePurchaseExpenses(
      purchaseItems,
      freight,
      other
    );

    for (let i = 0; i < allocatedItems.length; i++) {
      const it = allocatedItems[i];
      const rawItem = purchaseItems[i];
      const batchNum = `BATCH-${poNumber}-${i + 1}`;

      const batchBreakdown = LandedCostService.calculateUnitLandedCost({
        purchaseCost: it.unitCost,
        inboundFreight: it.allocatedFreight,
        packagingCost: rawItem.packagingCost || Number(packagingCost) || 0,
        labelCost: rawItem.labelCost || Number(labelCost) || 0,
        inspectionCost: Number(inspectionCost) || 0,
        otherCosts: it.allocatedOther
      });

      const batch = await ProductBatch.create({
        organizationId: orgId,
        productId: it.productId,
        batchNumber: batchNum,
        supplierId,
        purchaseId: savedPurchase._id,
        initialQuantity: it.quantity,
        remainingQuantity: it.quantity,
        purchaseCost: it.unitCost,
        packagingCost: batchBreakdown.packagingCost,
        labelCost: batchBreakdown.labelCost,
        inboundShipping: batchBreakdown.inboundFreight,
        inspectionCost: batchBreakdown.inspectionCost,
        importCost: 0,
        otherProcurementCost: batchBreakdown.otherCosts,
        landedCost: batchBreakdown.totalLandedCost,
        receivedDate: orderDate || new Date(),
        status: 'Active'
      });

      createdBatches.push(batch);

      // Recalculate Product's Weighted Average Landed Cost and Available Stock
      await LandedCostService.recalculateProductWAC(it.productId, orgId);
    }

    res.status(201).json({
      success: true,
      data: savedPurchase,
      batches: createdBatches
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
