import express from 'express';
import { getInventoryOverview, getInventoryMovements, createInventoryMovement } from '../controllers/inventoryController';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';

const router = express.Router();

router.use(protect);

router.get('/', getInventoryOverview);
router.get('/movements', getInventoryMovements);
router.post('/movement', requirePermission('inventory.manage'), createInventoryMovement);

export default router;
