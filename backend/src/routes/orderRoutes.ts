import express from 'express';
import { createOrder, getOrders } from '../controllers/orderController';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';

const router = express.Router();

router.use(protect); // All order routes are protected

router.route('/')
  .get(getOrders)
  .post(requirePermission('orders.manage'), createOrder);

export default router;
