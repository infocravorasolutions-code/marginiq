import express from 'express';
import { protect } from '../middlewares/auth';
import { AnalyticsService } from '../services/analytics/AnalyticsService';

const router = express.Router();

router.use(protect);

router.get('/dashboard', async (req: any, res) => {
  try {
    const { from, to } = req.query;
    const data = await AnalyticsService.getExecutiveDashboard(req.user.organizationId, from ? new Date(from as string) : undefined, to ? new Date(to as string) : undefined);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products', async (req: any, res) => {
  try {
    const result = await AnalyticsService.getProductProfitability(req.user.organizationId, req.query);
    res.json({ success: true, data: result.data, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/marketplaces', async (req: any, res) => {
  try {
    const data = await AnalyticsService.getMarketplaceComparison(req.user.organizationId, req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pricing', async (req: any, res) => {
  try {
    const data = await AnalyticsService.getPricingIntelligence(req.user.organizationId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/leakage', async (req: any, res) => {
  try {
    const data = await AnalyticsService.getLeakage(req.user.organizationId, req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/opportunities', async (req: any, res) => {
  try {
    const data = await AnalyticsService.getOpportunities(req.user.organizationId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
