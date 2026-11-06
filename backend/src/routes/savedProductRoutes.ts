import express from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middlewares/auth';
import SavedProduct from '../models/SavedProduct';
import Product from '../models/Product';

const router = express.Router();

router.use(protect);

// GET all saved products for the organization
router.get('/', async (req: AuthRequest, res) => {
  try {
    const savedProducts = await SavedProduct.find({ organizationId: req.user.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: savedProducts.length, data: savedProducts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST save a product
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { productId, productName, status, notes, assumptions, calculatedScore, calculatedMargin } = req.body;
    let resolvedName = productName;
    if (!resolvedName && typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ _id: productId, organizationId: req.user.organizationId }).select('name').lean();
      if (prod) resolvedName = prod.name;
    }

    const savedProduct = await SavedProduct.findOneAndUpdate(
      { userId: req.user._id, productId },
      {
        $set: {
          organizationId: req.user.organizationId,
          productName: resolvedName || (typeof productId === 'string' ? productId : 'Product'),
          status: status || 'Researching',
          notes: notes || '',
          assumptions: assumptions || { productCost: 100, shipping: 50, advertisingPercent: 5, returnPercent: 10 },
          calculatedScore,
          calculatedMargin
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: savedProduct });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH update status/notes/assumptions
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const updated = await SavedProduct.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Saved product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE remove saved product
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deleted = await SavedProduct.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Saved product not found' });
    }
    res.json({ success: true, message: 'Saved product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
