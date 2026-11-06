import mongoose from 'mongoose';
import Product from '../../models/Product';
import ProductBatch from '../../models/ProductBatch';

export interface LandedCostComponents {
  purchaseCost: number;
  inboundFreight?: number;
  packagingCost?: number;
  labelCost?: number;
  labourCost?: number;
  inspectionCost?: number;
  importDuty?: number;
  customsFee?: number;
  otherCosts?: number;
}

export interface LandedCostBreakdown extends LandedCostComponents {
  totalLandedCost: number;
}

export class LandedCostService {
  /**
   * Calculates the true landed cost per unit from individual components.
   * Formula: Purchase Cost + Inbound Freight + Packaging + Labelling + Labour + Inspection + Duties + Other
   */
  public static calculateUnitLandedCost(components: LandedCostComponents): LandedCostBreakdown {
    const purchaseCost = Number(components.purchaseCost) || 0;
    const inboundFreight = Number(components.inboundFreight) || 0;
    const packagingCost = Number(components.packagingCost) || 0;
    const labelCost = Number(components.labelCost) || 0;
    const labourCost = Number(components.labourCost) || 0;
    const inspectionCost = Number(components.inspectionCost) || 0;
    const importDuty = Number(components.importDuty) || 0;
    const customsFee = Number(components.customsFee) || 0;
    const otherCosts = Number(components.otherCosts) || 0;

    const totalLandedCost =
      purchaseCost +
      inboundFreight +
      packagingCost +
      labelCost +
      labourCost +
      inspectionCost +
      importDuty +
      customsFee +
      otherCosts;

    return {
      purchaseCost,
      inboundFreight,
      packagingCost,
      labelCost,
      labourCost,
      inspectionCost,
      importDuty,
      customsFee,
      otherCosts,
      totalLandedCost
    };
  }

  /**
   * Allocates shared purchase-level costs (e.g. total freight, customs) across multiple items.
   * Allocation method: Proportional by item total value (or quantity if values are equal).
   */
  public static allocatePurchaseExpenses(
    items: Array<{ productId: string; quantity: number; unitCost: number; packagingCost?: number; labelCost?: number }>,
    sharedFreight: number = 0,
    sharedOther: number = 0
  ) {
    const totalPurchaseValue = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
    const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

    return items.map((it) => {
      const itemTotalValue = it.quantity * it.unitCost;
      const proportion = totalPurchaseValue > 0 ? itemTotalValue / totalPurchaseValue : (it.quantity / (totalUnits || 1));

      const allocatedFreight = (sharedFreight * proportion) / it.quantity;
      const allocatedOther = (sharedOther * proportion) / it.quantity;

      const breakdown = this.calculateUnitLandedCost({
        purchaseCost: it.unitCost,
        inboundFreight: allocatedFreight,
        packagingCost: it.packagingCost || 0,
        labelCost: it.labelCost || 0,
        otherCosts: allocatedOther
      });

      return {
        ...it,
        allocatedFreight,
        allocatedOther,
        unitLandedCost: breakdown.totalLandedCost,
        totalLandedCost: breakdown.totalLandedCost * it.quantity
      };
    });
  }

  /**
   * Recalculates Weighted Average Cost (WAC) for a product based on active batches in the organization.
   * Updates Product.defaultLandedCost and Product.currentStock in the database.
   */
  public static async recalculateProductWAC(
    productId: string | mongoose.Types.ObjectId,
    organizationId: string | mongoose.Types.ObjectId
  ): Promise<{ weightedAverageCost: number; totalAvailableStock: number }> {
    const batches = await ProductBatch.find({
      productId,
      organizationId,
      status: 'Active',
      remainingQuantity: { $gt: 0 }
    }).lean();

    if (!batches || batches.length === 0) {
      const product = await Product.findOne({ _id: productId, organizationId }).lean();
      return {
        weightedAverageCost: product?.defaultLandedCost || product?.purchasePrice || 0,
        totalAvailableStock: product?.availableStock || 0
      };
    }

    let totalValuation = 0;
    let totalStock = 0;

    for (const batch of batches) {
      const qty = batch.remainingQuantity || 0;
      const unitLanded = batch.landedCost || batch.purchaseCost || 0;
      totalValuation += qty * unitLanded;
      totalStock += qty;
    }

    const weightedAverageCost = totalStock > 0 ? Number((totalValuation / totalStock).toFixed(2)) : 0;

    await Product.updateOne(
      { _id: productId, organizationId },
      {
        $set: {
          defaultLandedCost: weightedAverageCost,
          currentStock: totalStock,
          availableStock: totalStock
        }
      }
    );

    return {
      weightedAverageCost,
      totalAvailableStock: totalStock
    };
  }
}
