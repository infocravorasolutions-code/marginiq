import { Response } from 'express';
import InventoryMovement from '../models/InventoryMovement';
import Product from '../models/Product';
import { AuthRequest } from '../middlewares/auth';

export const getInventoryOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ organizationId: req.user.organizationId })
      .select('name sku currentStock reservedStock availableStock damagedStock returnedStock')
      .sort({ currentStock: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventoryMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await InventoryMovement.find({ organizationId: req.user.organizationId })
      .populate('productId', 'name sku')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, count: movements.length, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInventoryMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, movementType, unitCost, notes } = req.body;
    
    // Create movement log
    const movement = new InventoryMovement({
      organizationId: req.user.organizationId,
      productId,
      quantity,
      movementType,
      unitCost,
      totalCost: quantity * unitCost,
      notes,
      userId: req.user._id
    });
    
    await movement.save();

    // Update Product stock conditionally based on movement type
    // This is a naive implementation; complex business rules belong in a service layer
    const product = await Product.findOne({ _id: productId, organizationId: req.user.organizationId });
    if (product) {
      if (['Purchase', 'Return', 'Recovered Return', 'Adjustment', 'Transfer'].includes(movementType)) {
        product.currentStock += quantity;
      } else if (['Sale', 'Damage', 'Loss'].includes(movementType)) {
        product.currentStock -= quantity;
      }
      product.availableStock = product.currentStock - product.reservedStock;
      await product.save();
    }

    res.status(201).json({ success: true, data: movement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
