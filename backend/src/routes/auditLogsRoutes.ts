import express from 'express';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import { AuditService } from '../services/AuditService';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('settings.view'), async (req: any, res) => {
  try {
    const logs = await AuditService.getLogs(req.user.organizationId, req.query);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
