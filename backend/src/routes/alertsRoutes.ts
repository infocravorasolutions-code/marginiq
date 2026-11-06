import express from 'express';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import { AlertService } from '../services/alerts/AlertService';
import AlertPreference from '../models/AlertPreference';

const router = express.Router();

router.use(protect);

router.post('/evaluate', requirePermission('alerts.manage'), async (req: any, res) => {
  try {
    const count = await AlertService.evaluateRules(req.user.organizationId);
    res.json({ success: true, data: { newAlerts: count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/preferences', async (req: any, res) => {
  try {
    const prefs = await AlertPreference.find({ organizationId: req.user.organizationId, userId: req.user._id }).lean();
    res.json({ success: true, data: prefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/preferences/:type', async (req: any, res) => {
  try {
    const pref = await AlertPreference.findOneAndUpdate(
      { organizationId: req.user.organizationId, userId: req.user._id, alertType: req.params.type },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: pref });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', async (req: any, res) => {
  try {
    const data = await AlertService.getAlerts(req.user.organizationId, req.query.status as string || 'UNREAD');
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/read', async (req: any, res) => {
  try {
    const data = await AlertService.markRead(req.params.id, req.user.organizationId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/resolve', requirePermission('alerts.manage'), async (req: any, res) => {
  try {
    const data = await AlertService.resolve(req.params.id, req.user.organizationId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
