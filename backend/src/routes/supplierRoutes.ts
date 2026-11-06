import express from 'express';
import { getSuppliers, createSupplier, updateSupplier } from '../controllers/supplierController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/:id')
  .patch(updateSupplier);

export default router;
