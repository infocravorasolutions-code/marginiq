import express from 'express';
import { getFeeRules, createFeeRule, updateFeeRule, validateFeeRule } from '../controllers/feeRuleController';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';

const router = express.Router();

router.use(protect); // Ensure auth

router.route('/')
  .get(getFeeRules)
  .post(requirePermission('feeRules.manage'), createFeeRule);

router.route('/:id')
  .put(requirePermission('feeRules.manage'), updateFeeRule);

router.post('/validate', validateFeeRule);

export default router;
