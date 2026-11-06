import express from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middlewares/auth';
import Watchlist from '../models/Watchlist';
import Product from '../models/Product';

const router = express.Router();

router.use(protect);

// GET all watchlist items for the organization
router.get('/', async (req: AuthRequest, res) => {
  try {
    const watchlist = await Watchlist.find({ organizationId: req.user.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: watchlist.length, data: watchlist });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add product to watchlist
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { productId, productName, baselineMetrics, notificationsEnabled } = req.body;
    let resolvedName = productName;
    if (!resolvedName && typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ _id: productId, organizationId: req.user.organizationId }).select('name').lean();
      if (prod) resolvedName = prod.name;
    }

    const item = await Watchlist.findOneAndUpdate(
      { userId: req.user._id, productId },
      {
        $set: {
          organizationId: req.user.organizationId,
          productName: resolvedName || (typeof productId === 'string' ? productId : 'Product'),
          baselineMetrics: baselineMetrics || { price: 0, competitionScore: 50, opportunityScore: 50, reviewCount: 0 },
          notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE remove product from watchlist
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deleted = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Watchlist item not found' });
    }
    res.json({ success: true, message: 'Watchlist item deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
