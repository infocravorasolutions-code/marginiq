import express from 'express';
import { getPurchases, createPurchase } from '../controllers/purchaseController';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPurchases)
  .post(requirePermission('inventory.manage'), createPurchase);

export default router;
