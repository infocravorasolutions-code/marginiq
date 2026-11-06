import express from 'express';
import { calculateProfit, calculatePricing, compareMarketplaces } from '../controllers/profitabilityController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.use(protect); // Ensure auth

router.post('/calculate', calculateProfit);
router.post('/pricing', calculatePricing);
router.post('/compare', compareMarketplaces);

export default router;
